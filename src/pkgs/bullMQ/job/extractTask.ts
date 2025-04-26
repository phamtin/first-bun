import type Redis from "@/loaders/redis";
import { connectToRedis } from "@/loaders/redis";
import { Queue } from "bullmq";
import type { AccountModel } from "../../../database/model/account/account.model";
import { BULLMQ_CONFIG } from "../util";

export interface SyncModelJobData {
	model: "accounts" | "projects" | "tasks";
	payload: AccountModel;
}

export class SyncModelQueue {
	private static instance: SyncModelQueue | null = null;
	queue: Queue<SyncModelJobData> | null = null;

	private constructor() {
		// Private constructor to enforce singleton
	}

	private async initializeIfNeeded(): Promise<void> {
		if (!this.queue) {
			try {
				const connection = (await connectToRedis()) as Redis;
				this.queue = new Queue<SyncModelJobData>("SyncModelQueue", {
					connection,
					defaultJobOptions: BULLMQ_CONFIG.JOBS || {},
				});
			} catch (error) {
				console.error("Failed to initialize SyncModelQueue:", error);
				throw new Error("Queue initialization failed");
			}
		}
	}

	static async getInstance(): Promise<SyncModelQueue> {
		if (!SyncModelQueue.instance) {
			SyncModelQueue.instance = new SyncModelQueue();
		}
		await SyncModelQueue.instance.initializeIfNeeded();
		return SyncModelQueue.instance;
	}

	async close(): Promise<void> {
		if (this.queue) {
			await this.queue.close();
			this.queue = null;
			SyncModelQueue.instance = null; // Reset singleton
		}
	}

	static async addSyncModelJob(data: SyncModelJobData): Promise<void> {
		const instance = await SyncModelQueue.getInstance();
		if (!instance.queue) {
			throw new Error("Queue is not initialized");
		}
		await instance.queue.add("SyncModel", data);
	}
}
