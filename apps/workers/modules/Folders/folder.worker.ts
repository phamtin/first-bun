import type { PublishMessage } from "@/api/init-nats";
import { NatsEvent } from "@/shared/nats/types/events";
import { onInvitationWithdraw } from "./folder.fn";

const FolderWorker = async (msg: PublishMessage) => {
	switch (msg.subject) {
		case NatsEvent.Folders.WithdrawInvitation:
			await onInvitationWithdraw(msg);
			break;
		default:
			return;
	}
};

export default FolderWorker;
