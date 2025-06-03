import type { ObjectId } from "mongodb";
import * as v from "valibot";

import { objectId } from "../../../types/common.type";

export enum NotificationType {
	InviteJoinFolder = "InviteJoinFolder",
	AssignedTaskForYou = "AssignedTaskForYou",
	RemindImportantTasks = "RemindImportantTasks",
	WeeklyStats = "WeeklyStats",
	MonthlyStats = "MonthlyStats",
}

export enum InviteJoinFolderPayloadStatus {
	Active = "Active",
	Expired = "Expired",
}

export type InviteJoinFolderPayload = {
	status: InviteJoinFolderPayloadStatus;
	folderId: string;
	folderName: string;
	inviteeEmail: string;
	inviteeUsername: string;
	invitorId: string;
	invitorEmail: string;
	invitorAvatar: string;
	invitorUsername: string;
};

export type AssignedTaskForYouPayload = {
	title: string;
	assignerId: string;
	assignerAvatar: string;
	assignerUsername: string;
	folderId: string;
	folderName: string;
};

export type RemindImportantTasksPayload = {
	taskId: string;
	title: string;
	folderId: string;
	folderName: string;
	dueDate: string;
};

export type WeeklyStatsPayload = {
	week: string;
	totalTasks: number;
	totalCompletedTasks: number;
};

export type MonthlyStatsPayload = {
	month: string;
	totalTasks: number;
	totalCompletedTasks: number;
};

export type NotificationPayloadMap = {
	[NotificationType.InviteJoinFolder]: InviteJoinFolderPayload;
	[NotificationType.AssignedTaskForYou]: AssignedTaskForYouPayload;
	[NotificationType.RemindImportantTasks]: RemindImportantTasksPayload;
	[NotificationType.WeeklyStats]: WeeklyStatsPayload;
	[NotificationType.MonthlyStats]: MonthlyStatsPayload;
};

export type NotificationPayload<T extends NotificationType | undefined> = T extends NotificationType ? NotificationPayloadMap[T] : never;

/**
 *  -----------------------------
 *	|
 * 	| Mongo Model - Notification
 *	|
 * 	-----------------------------
 */

export type NotificationModel<T extends NotificationType> = {
	_id: ObjectId;

	title: string;
	read: boolean;
	type: T;
	accountId: ObjectId;
	payload: NotificationPayload<T>;

	createdAt: Date;
	createdBy?: ObjectId;
	updatedAt?: Date;
	deletedAt?: Date;
	deletedBy?: ObjectId;
};

/**
 *  -----------------------------
 *	|
 * 	| Validation Schema
 *	|
 * 	-----------------------------
 */

const commonNotificationModelFields = {
	_id: objectId,
	title: v.string(),
	read: v.boolean(),
	accountId: objectId,
	createdAt: v.date(),
	createdBy: v.optional(objectId),
	updatedAt: v.optional(v.date()),
	deletedAt: v.optional(v.date()),
	deletedBy: v.optional(objectId),
};

export const vInviteJoinFolderPayload = v.strictObject({
	status: v.enum(InviteJoinFolderPayloadStatus),
	folderId: v.string(),
	folderName: v.string(),
	inviteeEmail: v.string(),
	inviteeUsername: v.string(),
	invitorId: v.string(),
	invitorEmail: v.string(),
	invitorAvatar: v.string(),
	invitorUsername: v.string(),
});

export const vAssignedTaskForYouPayload = v.strictObject({
	title: v.string(),
	assignerId: v.string(),
	assignerAvatar: v.string(),
	assignerUsername: v.string(),
	folderId: v.string(),
	folderName: v.string(),
});

export const vRemindImportantTasksPayload = v.strictObject({
	taskId: v.string(),
	title: v.string(),
	folderId: v.string(),
	folderName: v.string(),
	dueDate: v.string(),
});

export const vWeeklyStatsPayload = v.strictObject({
	week: v.string(),
	totalTasks: v.number(),
	totalCompletedTasks: v.number(),
});

export const vMonthlyStatsPayload = v.strictObject({
	month: v.string(),
	totalTasks: v.number(),
	totalCompletedTasks: v.number(),
});

export const vInviteJoinFolderNotificationModel = v.strictObject({
	...commonNotificationModelFields,
	type: v.literal(NotificationType.InviteJoinFolder),
	payload: vInviteJoinFolderPayload,
});

export const vAssignedTaskForYouNotificationModel = v.strictObject({
	...commonNotificationModelFields,
	type: v.literal(NotificationType.AssignedTaskForYou),
	payload: vAssignedTaskForYouPayload,
});

export const vRemindImportantTasksNotificationModel = v.strictObject({
	...commonNotificationModelFields,
	type: v.literal(NotificationType.RemindImportantTasks),
	payload: vRemindImportantTasksPayload,
});

export const vWeeklyStatsNotificationModel = v.strictObject({
	...commonNotificationModelFields,
	type: v.literal(NotificationType.WeeklyStats),
	payload: vWeeklyStatsPayload,
});

export const vMonthlyStatsNotificationModel = v.strictObject({
	...commonNotificationModelFields,
	type: v.literal(NotificationType.MonthlyStats),
	payload: vMonthlyStatsPayload,
});

export const vNotificationPayload = v.union([
	vInviteJoinFolderPayload,
	vAssignedTaskForYouPayload,
	vRemindImportantTasksPayload,
	vWeeklyStatsPayload,
	vMonthlyStatsPayload,
]);

export const vNotificationModel = v.union([
	vInviteJoinFolderNotificationModel,
	vAssignedTaskForYouNotificationModel,
	vRemindImportantTasksNotificationModel,
	vWeeklyStatsNotificationModel,
	vMonthlyStatsNotificationModel,
]) satisfies v.BaseSchema<NotificationModel<NotificationType>, NotificationModel<NotificationType>, v.BaseIssue<unknown>>;
