import { Worker } from "bullmq";
import { IO_CONCURRENCY, QueueName, type SyncModelQueueJob } from "../../shared/services/bullMQ/type";
import { syncModelProcessor } from "./SyncModel.srv";
import type Redis from "@/shared/loaders/redis";
import { connectToRedis } from "@/shared/loaders/redis";

(() => {
	async function initializeWorker() {
		const worker = new Worker<SyncModelQueueJob>(QueueName.SyncModelQueue, syncModelProcessor, {
			connection: (await connectToRedis()) as Redis,
			concurrency: IO_CONCURRENCY,
		});

		worker.on("failed", (job, err) => {
			console.error(`❌ Job ${job?.id} failed:`, err);
		});

		worker.on("completed", (job) => {
			console.log(`-------------------- DONE job ${job?.id} successfully.`);
		});

		const shutdown = async () => {
			console.log("Shutting down worker SyncModelQueue");
			await worker.close();
			process.exit(0);
		};

		process.on("SIGINT", shutdown);
		process.on("SIGTERM", shutdown);
	}

	initializeWorker().catch((err) => {
		console.error("Failed to initialize worker:", err);
		process.exit(1);
	});
})();
