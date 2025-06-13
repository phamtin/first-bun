import type { JsMsg } from "nats";

import { postProcessAccountUpdate } from "./account.fn";

const AccountWorker = async (msg: JsMsg, msgData: unknown) => {
	switch (msg.subject) {
		case "events.accounts.updated":
			return postProcessAccountUpdate(msg);
		default:
			return;
	}
};

export default AccountWorker;
