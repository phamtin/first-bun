import type { JobsOptions } from "bullmq";

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
};

export { BULLMQ_CONFIG };
