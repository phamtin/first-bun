import { NatsEvent } from "@/shared/nats/types/events";

import { onTaskCreated, onTaskDeleted, onTaskUpdated } from "./task.fn";
import type { PublishMessage } from "@/api/init-nats";

const TaskWorker = async (msg: PublishMessage) => {
	switch (msg.subject) {
		case NatsEvent.Tasks.Created:
			await onTaskCreated(msg);
			break;
		case NatsEvent.Tasks.Updated:
			await onTaskUpdated(msg);
			break;
		case NatsEvent.Tasks.Deleted:
			await onTaskDeleted(msg);
			break;
		default:
			break;
	}
};

export default TaskWorker;
