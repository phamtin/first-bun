import type { NatsEventPayloadMap } from "@/shared/nats/types/events";
import { randomUUIDv7 } from "bun";
import { connect as connectNats, StringCodec, nanos, AckPolicy, DeliverPolicy, ReplayPolicy, MsgHdrsImpl } from "nats";
import type { ConsumerConfig, NatsConnection, Codec, JetStreamManager } from "nats";

interface PublishMessage {
	subject: string;
	messageId: string;
	data?: any;
	createdAt: string;
}

class NatsAPIWrapper {
	private static instance: NatsAPIWrapper | null = null;

	static consumerName = "nats-api";
	static natsServerUrl = "127.0.0.1:4222";
	static subject = "events.>";

	private consumerConfig: ConsumerConfig;
	private natsConnection: NatsConnection | null = null;
	private jetStream: JetStreamManager | null = null;
	private stringCodec: Codec<string>;
	private isConnecting = false;
	private connectionPromise: Promise<NatsConnection> | null = null;

	private constructor() {
		this.consumerConfig = {
			name: NatsAPIWrapper.consumerName,
			durable_name: NatsAPIWrapper.consumerName,
			description: "API - Nats consumer",
			max_deliver: 4,
			backoff: [nanos(5000), nanos(10000), nanos(15000)],
			filter_subjects: [NatsAPIWrapper.subject],
			ack_policy: AckPolicy.Explicit,
			deliver_policy: DeliverPolicy.All,
			replay_policy: ReplayPolicy.Instant,
		};

		this.stringCodec = StringCodec();
	}

	public static getInstance(): NatsAPIWrapper {
		if (!NatsAPIWrapper.instance) {
			NatsAPIWrapper.instance = new NatsAPIWrapper();
		}
		return NatsAPIWrapper.instance;
	}

	public async initialize(): Promise<void> {
		if (this.natsConnection && !this.natsConnection.isClosed()) {
			return;
		}
		if (this.isConnecting && this.connectionPromise) {
			await this.connectionPromise;
			return;
		}
		this.isConnecting = true;
		this.connectionPromise = this.connect();

		try {
			await this.connectionPromise;
			this.isConnecting = false;
		} catch (error) {
			this.isConnecting = false;
			this.connectionPromise = null;
			throw error;
		}
	}

	private async connect(): Promise<NatsConnection> {
		try {
			this.natsConnection = await connectNats({
				servers: [NatsAPIWrapper.natsServerUrl],
				name: this.consumerConfig.name,
				reconnect: true,
				reconnectTimeWait: 3000,
				maxReconnectAttempts: 10,
			});
			this.jetStream = await this.natsConnection.jetstreamManager();

			console.log("- API connected to NATS server ");
			return this.natsConnection;
		} catch (error) {
			console.error("Failed to connect to NATS server:", error);
			throw error;
		}
	}

	async publish<T extends keyof NatsEventPayloadMap>(subject: T, payload: NatsEventPayloadMap[T]): Promise<void> {
		if (!this.natsConnection) throw new Error("NATS connection not initialized");

		const js = this.natsConnection.jetstream();

		const message: PublishMessage = {
			subject,
			data: payload,
			messageId: randomUUIDv7(),
			createdAt: new Date().toISOString(),
		};
		const headers = new MsgHdrsImpl();

		/**
		 *  Nats-Msg-Id enable auto de-duplicate message by nats
		 */
		headers.set("Nats-Msg-Id", message.messageId);
		/**
		 *  Nats-Expected-Stream assure message is published to correct stream
		 */
		headers.set("Nats-Expected-Stream", "EVENTS");

		console.log(`[API] Publishing message subject=${message.subject} messageId=${message.messageId}`);

		await js.publish(subject, this.stringCodec.encode(JSON.stringify(message)), { headers });
	}

	async getStreamInfo(): Promise<any> {
		if (!this.jetStream?.streams) {
			throw new Error("JetStream not initialized");
		}

		const streamInfo = (await this.jetStream.streams.get("EVENTS")).info();
		return streamInfo;
	}

	async gracefulShutdown(): Promise<void> {
		if (this.natsConnection && !this.natsConnection.isClosed()) {
			await this.natsConnection.close();
		}
		this.jetStream = null;
		this.natsConnection = null;
		this.isConnecting = false;
		this.connectionPromise = null;
		NatsAPIWrapper.instance = null;
		console.log("NATS API shutdown completed");
	}

	get isConnected(): boolean {
		return this.natsConnection ? !this.natsConnection.isClosed() : false;
	}
}

export const APINatsPublisher = NatsAPIWrapper.getInstance();

export async function initNatsPublisher(): Promise<void> {
	const publisher = NatsAPIWrapper.getInstance();
	await publisher.initialize();
}

export type { PublishMessage };
