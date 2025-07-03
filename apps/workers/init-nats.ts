import type { Consumer, ConsumerConfig, NatsConnection, StreamInfo } from "nats";
import { AckPolicy, connect as connectNats, DeliverPolicy, nanos, ReplayPolicy, StorageType } from "nats";
import { INatsWrapper } from "@/shared/nats/classes";
import type { NatsEventPayloadMap } from "@/shared/nats/types/events";
import type { Context } from "@/shared/types/app.type";
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

class NatsWorkerWrapper extends INatsWrapper {
	private static instance: NatsWorkerWrapper | null = null;
	protected readonly consumerName = "nats-worker";
	protected readonly natsServerUrl = "127.0.0.1:4222";
	protected readonly subject = "events.>";

	protected consumerConfig: ConsumerConfig;
	protected natsConnection: NatsConnection | null = null;
	protected isShuttingDown: boolean;
	protected activeMessages: Set<string>;

	constructor() {
		super();
		this.consumerConfig = {
			name: this.consumerName,
			durable_name: this.consumerName,
			description: "Worker - Nats consumer",
			max_deliver: 6,
			backoff: [nanos(5000), nanos(10000), nanos(10000), nanos(10000), nanos(10000)],
			filter_subjects: [this.subject],
			ack_policy: AckPolicy.Explicit,
			deliver_policy: DeliverPolicy.All,
			replay_policy: ReplayPolicy.Instant,
		};
		this.initialize();

		this.isShuttingDown = false;
		this.activeMessages = new Set<string>(); // Track active message processing
	}

	public static getInstance(): NatsWorkerWrapper {
		if (!NatsWorkerWrapper.instance) {
			NatsWorkerWrapper.instance = new NatsWorkerWrapper();
		}
		return NatsWorkerWrapper.instance;
	}

	public async publish<T extends keyof NatsEventPayloadMap>(subject: T, payload: NatsEventPayloadMap[T] & { ctx: Context }): Promise<void> {
		// TODO: implement publish
	}

	public async initialize(): Promise<void> {
		if (this.natsConnection && !this.natsConnection.isClosed()) {
			return;
		}
		if (this.isConnecting) {
			return;
		}
		this.isConnecting = true;

		try {
			await this.connect();
			this.isConnecting = false;
		} catch (error) {
			this.isConnecting = false;
			throw error;
		}
	}

	async connect(): Promise<NatsConnection> {
		this.isConnecting = true;
		try {
			this.natsConnection = await connectNats({
				servers: [this.natsServerUrl],
				name: this.consumerConfig.name,
				reconnect: true,
				reconnectTimeWait: 5000,
				maxReconnectAttempts: 10,
			});
			if (!this.natsConnection.info) throw new Error("NATS connection not available");

			this.jetStream = await this.natsConnection.jetstreamManager();

			return this.natsConnection;
		} catch (error) {
			console.log("Failed to connect to NATS server:", error);
			throw error;
		} finally {
			this.isConnecting = false;
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
				await jsm.streams.add({ name: "EVENTS", subjects: [this.subject], storage: StorageType.File });
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

	async createSubscription(): Promise<void> {
		if (!this.natsConnection) throw new Error("NATS connection not established. Call connect() first.");

		if (!this.jetStream) throw new Error("JetStream not initialized.");

		try {
			await this.createOrUpdateStreamAndConsumer();

			if (!this.consumerConfig.name) throw new Error("Consumer name not specified");
		} catch (error) {
			console.log("Failed to create NATS JetStream consumer:", error);
			throw error;
		}
	}

	async startConsuming(): Promise<void> {
		if (!this.consumerName) throw new Error("Consumer not created, create one first");

		if (!this.jetStream) throw new Error("JetStream not initialized.");

		const messages = await (await this.jetStream.jetstream().consumers.get("EVENTS", this.consumerName)).consume();

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

	public async getStreamInfo(): Promise<StreamInfo> {
		if (!this.jetStream?.streams) {
			throw new Error("JetStream not initialized");
		}

		const streamInfo = (await this.jetStream.streams.get("EVENTS")).info();
		return streamInfo;
	}

	public get isConnected(): boolean {
		this.greet();
		return this.natsConnection ? !this.natsConnection.isClosed() : false;
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
