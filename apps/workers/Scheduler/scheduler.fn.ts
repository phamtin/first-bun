import type { JsMsg } from "nats";
import type { PublishMessage } from "@/api/init-nats";
import NotificationSrv from "@/api/modules/Notification";
import { InviteJoinFolderPayloadStatus } from "@/shared/database/model/notification/notification.model";
import { FolderColl } from "@/shared/loaders/mongo";
import type { EventPayload, NatsEvent } from "@/shared/nats/types/events";
import { toObjectId } from "@/shared/services/mongodb/helper";
import type { Context } from "@/shared/types/app.type";
import dayjs from "@/shared/utils/dayjs";

export const processExpiredInvitation = async (jsMsg: JsMsg, msg: PublishMessage) => {
	const ctx: Context = msg.ctx;
	const { data }: EventPayload<typeof NatsEvent.Scheduled.ExpiredInvitation> = msg.data;

	const now = dayjs();

	const diffTimeInMs = dayjs(data.expiredAt).diff(now, "millisecond");

	if (diffTimeInMs > 0 && now.isBefore(data.expiredAt)) {
		jsMsg.nak(diffTimeInMs);
		return;
	}

	const folder = await FolderColl.findOne({ _id: toObjectId(data.folderId) });

	if (!folder) return;

	const notExpiredYetInvitations = folder.participantInfo.invitations.filter((inv) => {
		return dayjs(inv.expiredAt).isAfter(now);
	});

	await NotificationSrv.updateNotifications(ctx, {
		filter: {
			_id: {
				$in: data.notiIds.map((id) => toObjectId(id)),
			},
		},
		payload: {
			payload: { status: InviteJoinFolderPayloadStatus.Expired },
		},
	});

	await FolderColl.updateOne(
		{
			_id: folder._id,
		},
		{
			$set: { "participantInfo.invitations": notExpiredYetInvitations },
		},
	);
};
