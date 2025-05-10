import type { ETLQueueJob } from "@/shared/services/bullMQ/type";
import type { Job } from "bullmq";

const extractDataProcessor = async (job: Job<ETLQueueJob>) => {
	console.log(`-------------------- START job ${job.id} --------------------`, job.data);

	const task = job.data.payload.task;

	return { status: "success" };
};

export { extractDataProcessor };
