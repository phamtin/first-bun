import { type NotificationModel, type NotificationPayload, NotificationType } from "@/shared/database/model/notification/notification.model";
import { AppError } from "@/shared/utils/error";
import { InviteJoinFolderPayloadStatus } from "@/shared/database/model/notification/notification.model";

const buildInviteJoinFolderPayload = (request: any): NotificationModel<NotificationType.InviteJoinFolder>["payload"] => {
	const r: NotificationModel<NotificationType.InviteJoinFolder>["payload"] = {
		status: InviteJoinFolderPayloadStatus.Active,
		folderId: "",
		folderName: "",
		inviteeEmail: "",
		inviteeUsername: "",
		invitorId: "",
		invitorEmail: "",
		invitorAvatar: "",
		invitorUsername: "",
	};

	if (!request) return r;

	if (request.folderId) {
		r.folderId = request.folderId;
	}
	if (request.folderName) {
		r.folderName = request.folderName;
	}
	if (request.inviteeEmail) {
		r.inviteeEmail = request.inviteeEmail;
	}
	if (request.inviteeUsername) {
		r.inviteeUsername = request.inviteeUsername;
	}
	if (request.invitorId) {
		r.invitorId = request.invitorId;
	}
	if (request.invitorEmail) {
		r.invitorEmail = request.invitorEmail;
	}
	if (request.invitorAvatar) {
		r.invitorAvatar = request.invitorAvatar;
	}
	if (request.invitorUsername) {
		r.invitorUsername = request.invitorUsername;
	}
	if (request.status) {
		r.status = request.status;
	}

	return r;
};

const buildAssignedTaskPayload = (request: any): NotificationModel<NotificationType.AssignedTaskForYou>["payload"] => {
	const r: NotificationModel<NotificationType.AssignedTaskForYou>["payload"] = {
		taskId: request.taskId,
		assigneeId: request.assigneeId,
		assigneeEmail: request.assigneeEmail,
		title: request.title,
		assignerId: request.assignerId,
		assignerAvatar: request.assignerAvatar,
		assignerUsername: request.assignerUsername,
		folderId: request.folderId,
		folderName: request.folderName,
	};

	return r;
};

const buildRemindImportantTasksPayload = (request: any): NotificationModel<NotificationType.RemindImportantTasks>["payload"] => {
	const r: NotificationModel<NotificationType.RemindImportantTasks>["payload"] = {
		taskId: request.taskId,
		title: request.title,
		folderId: request.folderId,
		folderName: request.folderName,
		dueDate: "",
	};

	return r;
};

const buildWeeklyStatsPayload = (request: any): NotificationModel<NotificationType.WeeklyStats>["payload"] => {
	const r: NotificationModel<NotificationType.WeeklyStats>["payload"] = {
		week: "",
		totalTasks: 0,
		totalCompletedTasks: 0,
	};

	return r;
};

const buildMonthlyStatsPayload = (request: any): NotificationModel<NotificationType.MonthlyStats>["payload"] => {
	const r: NotificationModel<NotificationType.MonthlyStats>["payload"] = {
		month: "",
		totalTasks: 0,
		totalCompletedTasks: 0,
	};

	return r;
};

const NotificationBuilderFactory = <T extends NotificationType>(type: T, request: NotificationPayload<T>): NotificationModel<T>["payload"] => {
	const createBuilder = (type: T) => {
		switch (type) {
			case NotificationType.InviteJoinFolder:
				return buildInviteJoinFolderPayload(request);
			case NotificationType.AssignedTaskForYou:
				return buildAssignedTaskPayload(request);
			case NotificationType.RemindImportantTasks:
				return buildRemindImportantTasksPayload(request);
			case NotificationType.WeeklyStats:
				return buildWeeklyStatsPayload(request);
			case NotificationType.MonthlyStats:
				return buildMonthlyStatsPayload(request);
			default:
				throw new AppError("BAD_REQUEST", `Unsupported notification type: ${type}`);
		}
	};

	return createBuilder(type) as NotificationModel<T>["payload"];
};

export { NotificationBuilderFactory };
