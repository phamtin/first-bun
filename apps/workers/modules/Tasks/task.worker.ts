import type { PublishMessage } from "@/api/init-nats";
import { NatsEvent } from "@/shared/nats/types/events";
import { TaskFn } from "./task.fn";

const TaskWorker = async (msg: PublishMessage) => {
	switch (msg.subject) {
		case NatsEvent.Tasks.Created:
			await TaskFn.onTaskCreated(msg);
			break;
		case NatsEvent.Tasks.Updated:
			await TaskFn.onTaskUpdated(msg);
			break;
		case NatsEvent.Tasks.Deleted:
			await TaskFn.onTaskDeleted(msg);
			break;
		default:
			break;
	}
};

export default TaskWorker;
