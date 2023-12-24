import { ConnectionOptions, Job } from "bullmq";

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

export const concurrency = 10;
