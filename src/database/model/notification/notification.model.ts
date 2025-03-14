import type { ObjectId } from "mongodb";
import * as v from "valibot";

import { objectId, vAttributePattern, type AttributePattern } from "../../../types/common.type";

export enum NotificationType {
	InviteJoinProject = "InviteJoinProject",
	AssignedTaskForYou = "AssignedTaskForYou",
}

/**
 *  -----------------------------
 *	|
 * 	| Mongo Model - Notification
 *	|
 * 	-----------------------------
 */

export type NotificationModel = {
	_id: ObjectId;

	title: string;
	read: boolean;
	type: NotificationType;
	accountId: ObjectId;
	payload: AttributePattern[];

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

export const vNotificationModel = v.strictObject({
	_id: objectId,

	title: v.string(),
	read: v.boolean(),
	type: v.enum(NotificationType),
	accountId: objectId,
	payload: v.array(vAttributePattern),

	createdAt: v.date(),
	createdBy: v.optional(objectId),
	updatedAt: v.optional(v.date()),
	deletedAt: v.optional(v.date()),
	deletedBy: v.optional(objectId),
}) satisfies v.BaseSchema<NotificationModel, NotificationModel, v.BaseIssue<unknown>>;
