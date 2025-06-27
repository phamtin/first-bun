import type { JsMsg } from "nats";
import type { PublishMessage } from "@/api/init-nats";
import { NatsEvent } from "@/shared/nats/types/events";
import { processExpiredInvitation } from "./scheduler.fn";

const SchedulerWorker = async (jsMsg: JsMsg, msg: PublishMessage) => {
	switch (msg.subject) {
		case NatsEvent.Scheduled.ExpiredInvitation:
			await processExpiredInvitation(jsMsg, msg);
			break;
		default:
			return;
	}
};

export default SchedulerWorker;
