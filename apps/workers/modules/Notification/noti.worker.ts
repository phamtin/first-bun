import type { JsMsg } from "nats";
import type { PublishMessage } from "@/api/init-nats";

const NotificationWorker = async (jsMsg: JsMsg, msg: PublishMessage) => {
	switch (msg.subject) {
		default:
			break;
	}
};

export default NotificationWorker;
