import Redis from "@/loaders/redis";
import { Worker, type Job } from "bullmq";
import type { SyncModelJobData } from "../queue/SyncModel.queue";
import { CONCURRENCY } from "../type";
import { AppError } from "@/utils/error";
import { syncCollectionAccounts } from "./SyncModel";

const processor = async (job: Job<SyncModelJobData>) => {
	console.log(`- Processing job ${job.id}: `, job.data);

	const collection = job.data.model;

	switch (collection) {
		case "accounts":
			await syncCollectionAccounts(job);
			break;

		default:
			throw new AppError("INTERNAL_SERVER_ERROR", "Unknown collection");
	}

	return { status: "success" };
};

const myWorker = new Worker<SyncModelJobData>("SyncModelQueue", processor, {
	connection: Redis.getClient() as Redis,
	concurrency: CONCURRENCY,
});

myWorker.on("failed", (job, err) => {
	console.error(`❌ Job ${job?.id} failed:`, err);
});

myWorker.on("completed", (job) => {
	console.log(`✅ Job ${job?.id} completed successfully.`);
});

const shutdown = async () => {
	console.log("🔄 Shutting down worker...");
	await myWorker.close();
	process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
