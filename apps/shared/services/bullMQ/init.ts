import { QueueContainer } from "./queue/BaseQueue";

const initBullMQ = async () => {
	try {
		await QueueContainer().init();
		console.log("- Initialized job queues");
	} catch (error) {
		console.log("- Failled to init job queues:X ", error);
		QueueContainer().closeQueues();
		process.exit(1);
	}
};

export { initBullMQ };
