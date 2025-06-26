import type { JsMsg } from "nats";
import type { PublishMessage } from "@/api/init-nats";
import { NatsEvent } from "@/shared/nats/types/events";
import { NotificationFn } from "./noti.fn";

const NotificationWorker = async (jsMsg: JsMsg, msg: PublishMessage) => {
	switch (msg.subject) {
		case NatsEvent.Notifications.Expired:
			await NotificationFn.handleNotificationExpiration(jsMsg, msg);
			break;

		default:
			break;
	}
};

export default NotificationWorker;
