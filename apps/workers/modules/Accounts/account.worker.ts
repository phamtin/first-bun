import type { PublishMessage } from "@/api/init-nats";

import { postProcessAccountUpdate } from "./account.fn";

const AccountWorker = async (msg: PublishMessage) => {
	switch (msg.subject) {
		case "events.accounts.updated":
			await postProcessAccountUpdate(msg);
			break;
		default:
			return;
	}
};

export default AccountWorker;
