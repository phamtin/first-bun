import { type Codec, type ConsumerConfig, type JetStreamManager, type NatsConnection, StringCodec } from "nats";
import type { Context } from "@/shared/types/app.type";
import type { NatsEventPayloadMap } from "../types/events";

abstract class INatsWrapper {
	protected abstract readonly consumerName: string;
	protected abstract readonly natsServerUrl: string;
	protected abstract readonly subject: string;
	protected abstract readonly consumerConfig: ConsumerConfig;

	protected natsConnection: NatsConnection | null = null;
	protected jetStream: JetStreamManager | null = null;
	protected stringCodec: Codec<string>;
	protected isConnecting: boolean = false;

	constructor() {
		this.stringCodec = StringCodec();
	}

	protected abstract connect(): Promise<NatsConnection>;
	public abstract initialize(): Promise<void>;
	public abstract publish<T extends keyof NatsEventPayloadMap>(subject: T, payload: NatsEventPayloadMap[T] & { ctx: Context }): Promise<void>;
	public abstract getStreamInfo(): Promise<unknown>;
	public abstract gracefulShutdown(): Promise<void>;
	public abstract get isConnected(): boolean;

	greet(): void {
		console.log(`This is a Nats wrapper for ${this.consumerName}`);
	}
}

export { INatsWrapper };
