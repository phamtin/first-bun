import type { JobsOptions } from "bullmq";

const QUEUES = ["SYNC_MODEL", "EXTRACT_DATA"];

const JOBS: JobsOptions = {
	priority: 0, //	highest priority
	attempts: 3,
	backoff: {
		type: "exponential",
		delay: 5000,
	},
	removeOnComplete: false,
	removeOnFail: false,
};

const BULLMQ_CONFIG = {
	JOBS,
	QUEUES,
};

export { BULLMQ_CONFIG };
