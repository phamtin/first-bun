import type { ConnectionOptions, Job } from "bullmq";
import type { AccountModel } from "../../database/model/account/account.model";
import type { TaskModel } from "../../database/model/task/task.model";

export const connection: ConnectionOptions = {
	host: "localhost",
	port: 6379,
};

export interface JobImp {
	name: string;
	payload: Record<string, unknown>;
	handle: (job?: Job) => void;
	failed: (job: Job) => void;
}

export const IO_CONCURRENCY = 100;
export const CPU_CONCURRENCY = 10;

export enum QueueName {
	SyncModelQueue = "SyncModelQueue",
	ETLQueue = "ETLQueue",
}

export type QueueStruct = {
	[QueueName.SyncModelQueue]: {
		SyncModel: {
			payload: {
				model: "accounts" | "projects" | "tasks" | "notifications" | "meetings" | "pomodoros";
				payload: AccountModel;
			};
		};
	};
	[QueueName.ETLQueue]: {
		Extract: {
			payload: {
				task: TaskModel;
			};
		};
		Transform: {
			payload: {
				task: unknown;
			};
		};
		Load: {
			payload: {
				task: unknown;
			};
		};
	};
};

export type SyncModelQueueJob = QueueStruct[QueueName.SyncModelQueue][keyof QueueStruct[QueueName.SyncModelQueue]];

export type ETLQueueJob = QueueStruct[QueueName.ETLQueue][keyof QueueStruct[QueueName.ETLQueue]];
