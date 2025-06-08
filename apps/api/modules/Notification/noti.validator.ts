import * as v from "valibot";
import type { InferInput } from "valibot";
import { NotificationType, vNotificationPayload } from "@/shared/database/model/notification/notification.model";
import { objectId, stringObjectId } from "@/shared/types/common.type";

export const createRequest = v.strictObject({
	title: v.string(),
	type: v.enum(NotificationType),
	payload: vNotificationPayload,
	accountId: stringObjectId,
	email: v.optional(stringObjectId),
});

export const createResponse = objectId;

export const getNotificationsRequest = v.strictObject({
	accountId: v.optional(stringObjectId),
	createdFrom: v.optional(v.pipe(v.string(), v.isoTimestamp("Timestamp is bad formatted"))),
	createdTo: v.optional(v.pipe(v.string(), v.isoTimestamp("Timestamp is bad formatted"))),
});

export const markAsReadRequest = v.strictObject({
	markAll: v.optional(v.boolean()),
	notificationId: v.optional(stringObjectId),
});

export const updateNotiByIdRequest = v.strictObject({
	notificationId: stringObjectId,
	title: v.optional(v.string()),
	read: v.optional(v.boolean()),
	payload: v.optional(v.record(v.string(), v.union([v.string(), v.boolean(), v.array(v.string())]))),
});

export const deleteRequest = v.strictObject({
	deleteAll: v.optional(v.boolean()),
	notificationId: v.optional(stringObjectId),
});

export const updateNotificationsRequest = v.strictObject({
	accountId: v.optional(stringObjectId),
	read: v.optional(v.boolean()),
	payload: v.optional(v.record(v.string(), v.union([v.string(), v.boolean(), v.array(v.string())]))),
});

export type CreateRequest = InferInput<typeof createRequest>;
export type CreateResponse = InferInput<typeof createResponse>;
export type GetNotificationsRequest = InferInput<typeof getNotificationsRequest>;
export type MarkAsReadRequest = InferInput<typeof markAsReadRequest>;
export type UpdateNotiByIdRequest = InferInput<typeof updateNotiByIdRequest>;
export type DeleteRequest = InferInput<typeof deleteRequest>;
export type UpdateNotificationsRequest = InferInput<typeof updateNotificationsRequest>;
