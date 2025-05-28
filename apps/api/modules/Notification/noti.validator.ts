import * as v from "valibot";
import type { InferInput } from "valibot";
import { NotificationType, vNotificationModel } from "@/shared/database/model/notification/notification.model";
import { objectId, stringObjectId, vAttributePattern } from "@/shared/types/common.type";

export const createRequest = v.strictObject({
	title: v.string(),
	type: v.enum(NotificationType),
	payload: v.array(vAttributePattern),
	accountId: v.optional(stringObjectId),
	email: v.optional(stringObjectId),
});

export const createResponse = objectId;

export const getNotificationsRequest = v.strictObject({
	createdFrom: v.optional(v.pipe(v.string(), v.isoTimestamp("Timestamp is bad formatted"))),
	createdTo: v.optional(v.pipe(v.string(), v.isoTimestamp("Timestamp is bad formatted"))),
});

export const getNotificationsResponse = v.array(vNotificationModel);

export const markAsReadRequest = v.strictObject({
	markAll: v.optional(v.boolean()),
	notificationId: v.optional(stringObjectId),
});

export const updateNotiRequest = v.strictObject({
	notificationId: stringObjectId,
	title: v.optional(v.string()),
	read: v.optional(v.boolean()),
	payload: v.optional(v.array(vAttributePattern)),
});

export const deleteRequest = v.strictObject({
	deleteAll: v.optional(v.boolean()),
	notificationId: v.optional(stringObjectId),
});

export type CreateRequest = InferInput<typeof createRequest>;
export type CreateResponse = InferInput<typeof createResponse>;
export type GetNotificationsRequest = InferInput<typeof getNotificationsRequest>;
export type GetNotificationsResponse = InferInput<typeof getNotificationsResponse>;
export type MarkAsReadRequest = InferInput<typeof markAsReadRequest>;
export type UpdateNotiRequest = InferInput<typeof updateNotiRequest>;
export type DeleteRequest = InferInput<typeof deleteRequest>;
