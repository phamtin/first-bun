import { APINatsPublisher, type PublishMessage } from "@/api/init-nats";
import AccountSrv from "@/api/modules/Accounts";
import { DEFAULT_INVITATION_TITLE, PROJECT_INVITATION_EXPIRED_MINUTE } from "@/api/modules/Folder/folder.const";
import NotificationSrv from "@/api/modules/Notification";
import { NotificationBuilderFactory } from "@/api/modules/Notification/noti.util";
import { InviteJoinFolderPayloadStatus, NotificationType } from "@/shared/database/model/notification/notification.model";
import { type EventPayload, NatsEvent } from "@/shared/nats/types/events";
import type { Context } from "@/shared/types/app.type";
import type { StringId } from "@/shared/types/common.type";
import dayjs from "@/shared/utils/dayjs";

const onInvitationWithdraw = async (msg: PublishMessage) => {
	const ctx: Context = msg.ctx;
	const { folder, request }: StringId<EventPayload<typeof NatsEvent.Folders.WithdrawInvitation>> = msg.data;

	const assignee = folder.participantInfo.members.find((members) => members.profileInfo.email === request.inviteeEmail);

	if (!assignee) return;

	const NotiCreatedFrom = dayjs().subtract(1, "month").toISOString(); // Random limit

	const notifications = await NotificationSrv.getNotifications(ctx, {
		accountId: assignee._id,
		createdFrom: NotiCreatedFrom,
	});

	if (!notifications?.length) return;

	// biome-ignore lint/suspicious/noExplicitAny: ignore
	const notiToDelete = notifications.filter((noti: any) => {
		return noti.type === NotificationType.InviteJoinFolder && noti.accountId.equals(assignee._id) && noti.payload.folderId === folder._id;
	});

	if (!notiToDelete?.length) return;

	return NotificationSrv.deleteNotifications(ctx, {
		notificationIds: notiToDelete.map((noti) => noti._id.toHexString()),
	});
};

const onInvited = async (msg: PublishMessage) => {
	const ctx: Context = msg.ctx;
	const { folder, request }: StringId<EventPayload<typeof NatsEvent.Folders.Invited>> = msg.data;

	const invitees = await Promise.all(request.emails.map((email) => AccountSrv.findAccountProfile(ctx, { email })));

	const now = dayjs().toDate();

	const res = await NotificationSrv.bulkCreate(
		ctx,
		invitees
			.filter((i) => !!i)
			.map((i) => ({
				title: DEFAULT_INVITATION_TITLE,
				type: NotificationType.InviteJoinFolder,
				accountId: i._id.toHexString(),
				payload: NotificationBuilderFactory(NotificationType.InviteJoinFolder, {
					status: InviteJoinFolderPayloadStatus.Active,
					folderId: request.folderId,
					folderName: folder.folderInfo.title,
					inviteeEmail: i.profileInfo.email,
					inviteeUsername: i.profileInfo.username,
					invitorId: ctx.user._id,
					invitorEmail: ctx.user.email,
					invitorAvatar: ctx.user.avatar,
					invitorUsername: ctx.user.username,
				}),
				createdAt: now,
			})),
	);

	await APINatsPublisher.publish<typeof NatsEvent.Notifications.Expired>(NatsEvent.Notifications.Expired, {
		ctx,
		expiredAt: dayjs().add(PROJECT_INVITATION_EXPIRED_MINUTE, "minute").toDate(),
		notiIds: Object.values(res).map((id) => id.toHexString()),
	});
};

export { onInvitationWithdraw, onInvited };
