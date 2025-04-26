import type Redis from "@/loaders/redis";
import { connectToRedis } from "@/loaders/redis";
import { Queue } from "bullmq";
import type { AccountModel } from "../../../database/model/account/account.model";
import { BULLMQ_CONFIG } from "../util";

export interface ExtractDataJobData {
	model: "accounts" | "projects" | "tasks";
	payload: AccountModel;
}

export class ExtractDataQueue {
	private static instance: ExtractDataQueue | null = null;
	queue: Queue<ExtractDataJobData> | null = null;

	private constructor() {
		// Private constructor to enforce singleton
	}

	private async initializeIfNeeded(): Promise<void> {
		if (!this.queue) {
			try {
				const connection = (await connectToRedis()) as Redis;
				this.queue = new Queue<ExtractDataJobData>("ExtractDataQueue", {
					connection,
					defaultJobOptions: BULLMQ_CONFIG.JOBS || {},
				});
			} catch (error) {
				console.error("Failed to initialize ExtractDataQueue:", error);
				throw new Error("Queue initialization failed");
			}
		}
	}

	static async getInstance(): Promise<ExtractDataQueue> {
		if (!ExtractDataQueue.instance) {
			ExtractDataQueue.instance = new ExtractDataQueue();
		}
		await ExtractDataQueue.instance.initializeIfNeeded();
		return ExtractDataQueue.instance;
	}

	async close(): Promise<void> {
		if (this.queue) {
			await this.queue.close();
			this.queue = null;
			ExtractDataQueue.instance = null; // Reset singleton
		}
	}

	static async addSyncModelJob(data: ExtractDataJobData): Promise<void> {
		const instance = await ExtractDataQueue.getInstance();
		if (!instance.queue) {
			throw new Error("Queue is not initialized");
		}
		await instance.queue.add("SyncModel", data);
	}
}
