import type { PublishMessage } from "@/api/init-nats";
import { NatsEvent } from "@/shared/nats/types/events";
import { onInvitationWithdraw, onInvited } from "./folder.fn";

const FolderWorker = async (msg: PublishMessage) => {
	switch (msg.subject) {
		case NatsEvent.Folders.Invited:
			await onInvited(msg);
			break;
		case NatsEvent.Folders.WithdrawInvitation:
			await onInvitationWithdraw(msg);
			break;
		default:
			return;
	}
};

export default FolderWorker;
