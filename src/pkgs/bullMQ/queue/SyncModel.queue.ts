import type Redis from "@/loaders/redis";
import { connectToRedis } from "@/loaders/redis";
import { Queue } from "bullmq";
import type { AccountModel } from "../../../database/model/account/account.model";

export interface SyncModelJobData {
	model: "accounts" | "projects" | "tasks";
	payload: AccountModel;
}

const SyncModelQueue = new Queue<SyncModelJobData>("SyncModelQueue", {
	connection: (await connectToRedis()) as Redis,
	defaultJobOptions: {
		attempts: 1,
		backoff: { type: "exponential", delay: 5000 },
		removeOnComplete: true,
		removeOnFail: false,
	},
});

export const addSyncModelJob = async (data: SyncModelJobData) => {
	await SyncModelQueue.add("SyncModel", data, {
		attempts: 3,
		backoff: {
			type: "exponential",
			delay: 1000,
		},
	});
};
