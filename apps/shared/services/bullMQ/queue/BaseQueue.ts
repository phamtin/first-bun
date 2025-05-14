import type Redis from "@/shared/loaders/redis";
import { connectToRedis } from "@/shared/loaders/redis";
import { Queue, type JobsOptions, type QueueOptions } from "bullmq";
import { BULLMQ_CONFIG } from "../util";
import { HonoAdapter } from "@bull-board/hono";
import { serveStatic } from "hono/serve-static";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { type ETLQueueJob, QueueName, type SyncModelQueueJob, type QueueStruct } from "../type";
import { HonoApp } from "@/api";

let queueMap: Record<QueueName, Queue | null> = {
	SyncModelQueue: null,
	ETLQueue: null,
};

export const QueueContainer = () => {
	const resetQueue = () => {
		queueMap = {
			SyncModelQueue: null,
			ETLQueue: null,
		};
	};

	// const initDashboard = async (queues: Queue[]) => {
	// 	const serverAdapter = new HonoAdapter(serveStatic).setBasePath("/admin/queues");

	// 	createBullBoard({
	// 		serverAdapter,
	// 		queues: queues.map((queue) => new BullMQAdapter(queue)),
	// 	});

	// 	HonoApp.route("/admin/queues", serverAdapter.registerPlugin());
	// };

	const init = async () => {
		try {
			const isInit = Object.values(queueMap).every((v) => !!v);

			if (isInit) return;

			const connection = (await connectToRedis()) as Redis;
			const queueOptions: QueueOptions = {
				connection,
				defaultJobOptions: BULLMQ_CONFIG.JOBS,
			};

			queueMap[QueueName.SyncModelQueue] = new Queue<SyncModelQueueJob>(QueueName.SyncModelQueue, queueOptions);
			queueMap[QueueName.ETLQueue] = new Queue<ETLQueueJob>(QueueName.ETLQueue, queueOptions);

			const queues = Object.values(queueMap).filter((v) => !!v);

			if (queues.length !== Object.values(queueMap).length) {
				throw new Error("Queues initialization failed");
			}
			// await initDashboard(queues); //	WTF why call this cause error?

			process.on("SIGINT", closeQueues);
			process.on("SIGTERM", closeQueues);
		} catch (error) {
			resetQueue();
			throw error;
		}
	};

	const add = async <T extends QueueName>(
		queueName: T,
		jobName: keyof QueueStruct[T],
		jobData: QueueStruct[T][keyof QueueStruct[T]],
		opts?: JobsOptions,
	): Promise<string> => {
		if (!queueMap[queueName]) {
			throw new Error("Queue is not initialized");
		}
		return (await queueMap[queueName].add(jobName as string, jobData, opts)).id || "";
	};

	const closeQueue = async (queueName: QueueName): Promise<void> => {
		if (queueMap[queueName]) {
			await queueMap[queueName].close();
			queueMap[queueName] = null;
		}
	};

	const closeQueues = async () => {
		for (const queueName of Object.keys(queueMap)) {
			await closeQueue(queueName as QueueName);
		}
	};

	return {
		init,
		add,
		closeQueue,
		closeQueues,
	};
};
