import { randomUUIDv7 } from "bun";
import type { ConsumerConfig, NatsConnection, StreamInfo } from "nats";
import { AckPolicy, connect as connectNats, DeliverPolicy, MsgHdrsImpl, nanos, ReplayPolicy } from "nats";
import { INatsWrapper } from "@/shared/nats/classes";
import type { NatsEventPayloadMap } from "@/shared/nats/types/events";
import type { Context } from "@/shared/types/app.type";

interface PublishMessage {
	ctx: Context;
	subject: string;
	messageId: string;
	data?: any;
	createdAt: string;
}

class NatsAPIWrapper extends INatsWrapper {
	private static instance: NatsAPIWrapper | null = null;

	protected readonly consumerName = "nats-api";
	protected readonly natsServerUrl = "127.0.0.1:4222";
	protected readonly subject = "events.>";
	protected readonly consumerConfig: ConsumerConfig;

	private constructor() {
		super();
		this.consumerConfig = {
			name: this.consumerName,
			durable_name: this.consumerName,
			description: "API - Nats consumer",
			max_deliver: 4,
			backoff: [nanos(5000), nanos(10000), nanos(15000)],
			filter_subjects: [this.subject],
			ack_policy: AckPolicy.Explicit,
			deliver_policy: DeliverPolicy.All,
			replay_policy: ReplayPolicy.Instant,
		};
	}

	static getInstance(): NatsAPIWrapper {
		if (!NatsAPIWrapper.instance) {
			NatsAPIWrapper.instance = new NatsAPIWrapper();
		}
		return NatsAPIWrapper.instance;
	}

	async initialize(): Promise<void> {
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

	protected async connect(): Promise<NatsConnection> {
		try {
			this.natsConnection = await connectNats({
				servers: [this.natsServerUrl],
				name: this.consumerConfig.name,
				reconnect: true,
				reconnectTimeWait: 3000,
				maxReconnectAttempts: 10,
			});
			this.jetStream = await this.natsConnection.jetstreamManager();

			console.log("- API connected to NATS server");
			return this.natsConnection;
		} catch (error) {
			console.error("Failed to connect to NATS server:", error);
			throw error;
		}
	}

	async publish<T extends keyof NatsEventPayloadMap>(subject: T, payload: NatsEventPayloadMap[T] & { ctx: Context }): Promise<void> {
		if (!this.natsConnection) {
			console.log("- Initializing NATS connection...");
			await this.initialize();
		}
		if (!this.natsConnection) {
			throw new Error("NATS connection not initialized");
		}
		const js = this.natsConnection.jetstream();
		const { ctx, ...data } = payload;

		const message: PublishMessage = {
			ctx,
			subject,
			messageId: randomUUIDv7(),
			data,
			createdAt: new Date().toISOString(),
		};
		const headers = new MsgHdrsImpl();

		/**
		 * Nats-Msg-Id enables auto de-duplicate message by nats
		 */
		headers.set("Nats-Msg-Id", message.messageId);
		/**
		 * Nats-Expected-Stream assures message is published to correct stream
		 */
		headers.set("Nats-Expected-Stream", "EVENTS");

		console.log(`publishing subject=${message.subject} messageId=${message.messageId}`);

		await js.publish(subject, this.stringCodec.encode(JSON.stringify(message)), { headers });
	}

	async getStreamInfo(): Promise<StreamInfo> {
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
		NatsAPIWrapper.instance = null;
		console.log("NATS API shutdown completed");
	}

	get isConnected(): boolean {
		this.greet();
		return this.natsConnection ? !this.natsConnection.isClosed() : false;
	}
}

export const APINatsPublisher = NatsAPIWrapper.getInstance();

export async function initNatsPublisher(): Promise<void> {
	const publisher = NatsAPIWrapper.getInstance();
	await publisher.initialize();
}

export type { PublishMessage };
