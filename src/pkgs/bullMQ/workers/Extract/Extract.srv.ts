import type { Job } from "bullmq";
import type { ETLQueueJob } from "../../type";

const extractDataProcessor = async (job: Job<ETLQueueJob>) => {
	console.log(`-------------------- START job ${job.id} --------------------`, job.data);

	const task = job.data.payload.task;

	return { status: "success" };
};

export { extractDataProcessor };
