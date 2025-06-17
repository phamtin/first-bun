import type { PublishMessage } from "@/api/init-nats";
import FolderSrv from "@/api/modules/Folder/folder.srv";
import NotificationSrv from "@/api/modules/Notification";
import { NotificationBuilderFactory } from "@/api/modules/Notification/noti.util";
import { TITLE_ASSIGNED_TASK_FOR_YOU } from "@/api/modules/Tasks/task.constant";
import { checkRenewAssignedTaskNotification } from "@/api/modules/Tasks/task.helper";
import { NotificationType } from "@/shared/database/model/notification/notification.model";
import type { TaskModel } from "@/shared/database/model/task/task.model";
import type { EventPayload, NatsEvent } from "@/shared/nats/types/events";
import type { Context } from "@/shared/types/app.type";
import type { StringId } from "@/shared/types/common.type";

export const onTaskCreated = async (msg: PublishMessage) => {
	const ctx: Context = msg.ctx;

	const messageData: StringId<TaskModel> = msg.data;

	const assigneeInfo = messageData.assigneeInfo?.[0];

	if (!assigneeInfo) return;

	if (assigneeInfo._id !== ctx.user._id) {
		const [checkRenewNotiIds, folder] = await Promise.all([
			checkRenewAssignedTaskNotification(ctx, messageData._id, ctx.user._id, assigneeInfo._id),
			FolderSrv.getFolderById(ctx, messageData.folderId),
		]);

		if (checkRenewNotiIds) {
			await NotificationSrv.deleteNotifications(ctx, { notificationIds: checkRenewNotiIds });
		}

		await NotificationSrv.create(ctx, {
			title: TITLE_ASSIGNED_TASK_FOR_YOU,
			accountId: assigneeInfo._id,
			type: NotificationType.AssignedTaskForYou,
			payload: NotificationBuilderFactory(NotificationType.AssignedTaskForYou, {
				title: messageData.title,
				taskId: messageData._id,
				assigneeId: assigneeInfo._id,
				assigneeEmail: assigneeInfo.profileInfo.email,
				assignerId: ctx.user._id,
				assignerAvatar: ctx.user.avatar,
				assignerUsername: ctx.user.username,
				folderId: folder._id.toHexString(),
				folderName: folder.folderInfo.title,
			}),
		});
	}
};

export const onTaskUpdated = async (msg: PublishMessage) => {
	const ctx: Context = msg.ctx;

	const { task, request }: StringId<EventPayload<typeof NatsEvent.Tasks.Updated>> = msg.data;

	const assigneeInfo = task.assigneeInfo?.[0];

	if (!assigneeInfo) return;

	if (request.assigneeId && request.assigneeId !== ctx.user._id) {
		const [checkRenewNotiIds, folder] = await Promise.all([
			checkRenewAssignedTaskNotification(ctx, task._id, ctx.user._id, assigneeInfo._id),
			FolderSrv.getFolderById(ctx, task.folderId),
		]);

		if (checkRenewNotiIds) {
			await NotificationSrv.deleteNotifications(ctx, { notificationIds: checkRenewNotiIds });
		}

		await NotificationSrv.create(ctx, {
			title: TITLE_ASSIGNED_TASK_FOR_YOU,
			accountId: request.assigneeId,
			type: NotificationType.AssignedTaskForYou,
			payload: NotificationBuilderFactory(NotificationType.AssignedTaskForYou, {
				title: task.title,
				taskId: task._id,
				assigneeId: request.assigneeId,
				assigneeEmail: assigneeInfo.profileInfo.email,
				assignerId: ctx.user._id,
				assignerAvatar: ctx.user.avatar,
				assignerUsername: ctx.user.username,
				folderId: folder._id.toHexString(),
				folderName: folder.folderInfo.title,
			}),
		});
	}
};

export const onTaskDeleted = async (msg: PublishMessage) => {};
