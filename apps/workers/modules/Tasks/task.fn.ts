import { checkCreateAssignedTaskNotification } from "@/api/modules/Tasks/task.helper";
import type { Context } from "@/shared/types/app.type";
import type { TaskModel } from "@/shared/database/model/task/task.model";
import type { PublishMessage } from "@/api/init-nats";
import NotificationSrv from "@/api/modules/Notification";
import { NotificationBuilderFactory } from "@/api/modules/Notification/noti.util";
import { NotificationType } from "@/shared/database/model/notification/notification.model";
import { TITLE_ASSIGNED_TASK_FOR_YOU } from "@/api/modules/Tasks/task.constant";
import FolderSrv from "@/api/modules/Folder/folder.srv";
import type { StringId } from "@/shared/types/common.type";

export const onTaskCreated = async (msg: PublishMessage) => {
	const ctx: Context = msg.ctx;

	const messageData: StringId<TaskModel> = msg.data;

	const assigneeInfo = messageData.assigneeInfo?.[0];

	if (!assigneeInfo) return;

	const shouldCreateNoti = await checkCreateAssignedTaskNotification(ctx, messageData._id, ctx.user._id, assigneeInfo._id);

	if (!shouldCreateNoti) return;

	const folder = await FolderSrv.getFolderById(ctx, messageData.folderId);

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
};

export const onTaskUpdated = async (msg: PublishMessage) => {};

export const onTaskDeleted = async (msg: PublishMessage) => {};
