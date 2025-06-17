import NotificationSrv from "@/api/modules/Notification";
import type { PublishMessage } from "@/api/init-nats";
import type { Context } from "@/shared/types/app.type";
import { NotificationType } from "@/shared/database/model/notification/notification.model";
import { EventPayload } from "@/shared/nats/types/events";
import { NatsEvent } from "@/shared/nats/types/events";
import dayjs from "@/shared/utils/dayjs";

const onInvitationWithdraw = async (msg: PublishMessage) => {
	const ctx: Context = msg.ctx;
	const { folder, request }: EventPayload<typeof NatsEvent.Folders.WithdrawInvitation> = msg.data;

	const assignee = folder.participantInfo.members.find((members) => members.profileInfo.email === request.inviteeEmail);

	if (!assignee) return;

	const NotiCreatedFrom = dayjs().subtract(1, "month").toISOString();	// Random limit

	const notifications = await NotificationSrv.getNotifications(ctx, {
		accountId: assignee._id.toHexString(),
		createdFrom: NotiCreatedFrom,
	});

	if (!notifications?.length) return;


	return NotificationSrv.deleteNotifications(ctx, {
		notificationIds: notifications
			.filter((noti: any) => {
				return noti.type === NotificationType.InviteJoinFolder && noti.accountId.equals(assignee._id) && noti.payload.folderId === folder._id;
			})
			.map((noti) => noti._id.toHexString()),
	});
};

export { onInvitationWithdraw };
