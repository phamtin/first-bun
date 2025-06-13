import { connect as connectNats, StringCodec, AckPolicy, DeliverPolicy, nanos, ReplayPolicy, StorageType } from "nats";
import type { ConsumerConfig, NatsConnection, JetStreamClient, Consumer } from "nats";
import MessageProcessor from "./nats-error";

interface MessageData {
	eventType: string;
	documentId: string;
	correlationId: string;
	timestamp: string;
	data?: any;
}

interface DeadLetterData {
	originalMessage: MessageData;
	error: {
		message: string;
		stack?: string;
		name: string;
	};
	failedAt: string;
	consumerName: string;
}

class NatsWorkerWrapper {
	static consumerName = "nats-worker";
	static natsServerUrl = "127.0.0.1:4222";
	static subject = "events.>";

	private consumerConfig: ConsumerConfig;
	private natsConnection: NatsConnection | null = null;
	private jetStream: JetStreamClient | null = null;
	private consumer: Consumer | null = null;
	private isShuttingDown: boolean;
	private activeMessages: Set<string>;

	constructor() {
		this.consumerConfig = {
			name: NatsWorkerWrapper.consumerName,
			durable_name: NatsWorkerWrapper.consumerName,
			description: "Worker - Nats consumer",
			max_deliver: 6,
			backoff: [nanos(5000), nanos(10000), nanos(10000), nanos(10000), nanos(10000)],
			filter_subjects: [NatsWorkerWrapper.subject],
			ack_policy: AckPolicy.Explicit,
			deliver_policy: DeliverPolicy.All,
			replay_policy: ReplayPolicy.Instant,
		};
		this.connect();

		this.isShuttingDown = false;
		this.activeMessages = new Set<string>(); // Track active message processing
	}

	async connect(): Promise<NatsConnection> {
		try {
			this.natsConnection = await connectNats({
				servers: [NatsWorkerWrapper.natsServerUrl],
				name: this.consumerConfig.name,
				reconnect: true,
				reconnectTimeWait: 5000,
				maxReconnectAttempts: 10,
			});
			if (!this.natsConnection.info) throw new Error("NATS connection not available");

			this.jetStream = this.natsConnection.jetstream();

			return this.natsConnection;
		} catch (error) {
			console.log("Failed to connect to NATS server:", error);
			throw error;
		}
	}

	private async createOrUpdateStreamAndConsumer() {
		if (!this.natsConnection) throw new Error("NATS connection not established.");

		if (!this.consumerConfig.name) throw new Error("Consumer name not specified");

		const jsm = await this.natsConnection.jetstreamManager();

		try {
			await jsm.streams.info("EVENTS");
		} catch (error: any) {
			if (error.code === "404") {
				console.log("Creating EVENTS stream...");
				await jsm.streams.add({ name: "EVENTS", subjects: [NatsWorkerWrapper.subject], storage: StorageType.File });
			} else {
				throw error;
			}
		}
		try {
			await jsm.consumers.info("EVENTS", this.consumerConfig.name);
		} catch (error: any) {
			if (error.code === "404") {
				console.log("Creating consumer...");
				await jsm.consumers.add("EVENTS", this.consumerConfig);
			} else {
				throw error;
			}
		}
	}

	async createSubscription(): Promise<Consumer> {
		if (!this.natsConnection) throw new Error("NATS connection not established. Call connect() first.");

		if (!this.jetStream) throw new Error("JetStream not initialized.");

		try {
			await this.createOrUpdateStreamAndConsumer();

			this.consumer = await this.jetStream.consumers.get("EVENTS", this.consumerConfig.name);

			return this.consumer;
		} catch (error) {
			console.log("Failed to create NATS JetStream consumer:", error);
			throw error;
		}
	}

	async startConsuming(): Promise<void> {
		if (!this.consumer) throw new Error("Consumer not created, create one first");

		const messages = await this.consumer.consume();

		for await (const message of messages) {
			if (this.isShuttingDown) {
				message.nak();
				break;
			}
			const messageProcessor = new MessageProcessor();
			await messageProcessor.processMessage(message);
		}
	}

	async gracefulShutdown(): Promise<void> {
		this.isShuttingDown = true;
		const maxWaitTime = 20000;
		const checkInterval = 100;
		let waitTime = 0;

		while (this.activeMessages.size > 0 && waitTime < maxWaitTime) {
			console.log(`Waiting for ${this.activeMessages.size} active messages to complete...`);
			await this.sleep(checkInterval);
			waitTime += checkInterval;
		}
		if (this.natsConnection && !this.natsConnection.isClosed()) {
			await this.natsConnection.close();
		}

		console.log("Completed NATS graceful shutdown");
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

async function initNatConsumer(): Promise<void> {
	const consumer = new NatsWorkerWrapper();

	try {
		await consumer.connect();
		await consumer.createSubscription();
		await consumer.startConsuming();

		process.on("SIGTERM", async () => {
			console.log("Received SIGTERM signal");
			await consumer.gracefulShutdown();
			process.exit(0);
		});
		process.on("SIGINT", async () => {
			console.log("Received SIGINT signal");
			await consumer.gracefulShutdown();
			process.exit(0);
		});
		console.log("- Worker connected to NATS server");
	} catch (error) {
		console.log("Failed to start NATS Consumer:", error);
		process.exit(1);
	}
}

export { initNatConsumer };
