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

const createAssignedTaskNotification = async (ctx: Context, task: StringId<TaskModel>, assigneeId: string, assigneeEmail: string) => {
	const [checkRenewNotiIds, folder] = await Promise.all([
		checkRenewAssignedTaskNotification(ctx, task._id, ctx.user._id, assigneeId),
		FolderSrv.getFolderById(ctx, task.folderId),
	]);

	if (checkRenewNotiIds) await NotificationSrv.deleteNotifications(ctx, { notificationIds: checkRenewNotiIds });

	await NotificationSrv.create(ctx, {
		title: TITLE_ASSIGNED_TASK_FOR_YOU,
		accountId: assigneeId,
		type: NotificationType.AssignedTaskForYou,
		payload: NotificationBuilderFactory(NotificationType.AssignedTaskForYou, {
			title: task.title,
			taskId: task._id,
			assigneeId,
			assigneeEmail,
			assignerId: ctx.user._id,
			assignerAvatar: ctx.user.avatar,
			assignerUsername: ctx.user.username,
			folderId: folder._id.toHexString(),
			folderName: folder.folderInfo.title,
		}),
	});
};

const onTaskCreated = async (msg: PublishMessage) => {
	const ctx: Context = msg.ctx;

	const messageData: StringId<TaskModel> = msg.data;

	const assigneeInfo = messageData.assigneeInfo?.[0];

	if (!assigneeInfo) return;

	if (assigneeInfo._id !== ctx.user._id) {
		await createAssignedTaskNotification(ctx, messageData, assigneeInfo._id, assigneeInfo.profileInfo.email);
	}
};

const onTaskUpdated = async (msg: PublishMessage) => {
	const ctx: Context = msg.ctx;

	const { task, request }: StringId<EventPayload<typeof NatsEvent.Tasks.Updated>> = msg.data;

	const assigneeInfo = task.assigneeInfo?.[0];

	if (!assigneeInfo) return;

	if (request.assigneeId && request.assigneeId !== ctx.user._id) {
		await createAssignedTaskNotification(ctx, task, request.assigneeId, assigneeInfo.profileInfo.email);
	}
};

const onTaskDeleted = async (msg: PublishMessage) => {};

export const TaskFn = { onTaskCreated, onTaskUpdated, onTaskDeleted };
