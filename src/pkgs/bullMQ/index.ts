import type { Queue } from "bullmq";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { createBullBoard } from "@bull-board/api";
import { HonoAdapter } from "@bull-board/hono";
import { readdir } from "node:fs/promises";
import { serveStatic } from "hono/bun";
import { type SyncModelJobData, SyncModelQueue } from "./queue/SyncModel.queue";
import { HonoApp } from "../..";

const initializeQueues = async () => {
	try {
		const syncModelQueue = await SyncModelQueue.getInstance();

		return [syncModelQueue.queue as Queue<SyncModelJobData>];
	} catch (error) {
		console.log("❌ Failed to initialize Queues: ", error);
		process.exit();
	}
};

const initializeWorkers = async () => {
	try {
		const entries = await readdir("src/pkgs/bullMQ/workers", { withFileTypes: true });

		const folders = entries.filter((entry) => entry.isDirectory());

		const workerFilePromisors = [];

		for (const folder of folders) {
			workerFilePromisors.push(import(`./workers/${folder.name}/index.ts`));
		}

		await Promise.all(workerFilePromisors);
	} catch (error) {
		console.log("❌ Failed to initialize workers: ", error);
		process.exit();
	}
};

const initBullMQ = async () => {
	await initializeWorkers();

	const queues = await initializeQueues();

	const serverAdapter = new HonoAdapter(serveStatic);

	serverAdapter.setBasePath("/admin/queues");

	createBullBoard({
		serverAdapter,
		queues: queues.map((queue) => new BullMQAdapter(queue)),
	});

	HonoApp.route("/admin/queues", serverAdapter.registerPlugin());

	console.log("- Job queue initialized");
};

export { initBullMQ };
