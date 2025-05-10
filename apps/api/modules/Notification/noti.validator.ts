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

export const getNotificationsByAccountIdRequest = v.strictObject({
	accountId: stringObjectId,
});

export const getNotificationsByAccountIdResponse = v.array(vNotificationModel);

export const markAsReadRequest = v.strictObject({
	markAll: v.boolean(),
	notificationId: stringObjectId,
});

export const deleteRequest = v.strictObject({
	deleteAll: v.boolean(),
	notificationId: stringObjectId,
});

export type CreateRequest = InferInput<typeof createRequest>;
export type CreateResponse = InferInput<typeof createResponse>;
export type GetNotificationsByAccountIdRequest = InferInput<typeof getNotificationsByAccountIdRequest>;
export type GetNotificationsByAccountIdResponse = InferInput<typeof getNotificationsByAccountIdResponse>;
export type MarkAsReadRequest = InferInput<typeof markAsReadRequest>;
export type DeleteRequest = InferInput<typeof deleteRequest>;
