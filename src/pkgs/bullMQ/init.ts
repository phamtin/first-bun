import { WorkerContainer } from "./workers/BaseWorker";
import { QueueContainer } from "./queue/BaseQueue";

const initBullMQ = async () => {
	try {
		await QueueContainer().init();
		await WorkerContainer().init();
		console.log("- Initialized message queue");
	} catch (error) {
		console.log("- Failed to init message queue: ", error);
		QueueContainer().closeQueues();
		process.exit(1);
	}
};

export { initBullMQ };
