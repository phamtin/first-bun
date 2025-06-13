import type { JsMsg } from "nats";
import { NatsEvent } from "@/shared/nats/types/events";

const TaskWorker = async (msg: JsMsg, msgData: unknown) => {
	if (msg.subject === NatsEvent.Tasks.Created) {
		return;
	}
};

export default TaskWorker;
