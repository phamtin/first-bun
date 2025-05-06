import type Redis from "@/loaders/redis";
import { connectToRedis } from "@/loaders/redis";
import { Worker } from "bullmq";
import { IO_CONCURRENCY, QueueName, type ETLQueueJob } from "../../type";
import { extractDataProcessor } from "./Extract.srv";

(() => {
	async function initializeWorker() {
		const worker = new Worker<ETLQueueJob>(QueueName.ETLQueue, extractDataProcessor, {
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
			console.log("🔄 Shutting down worker...");
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
