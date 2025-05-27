import type { Context } from "hono";
import type { UpdateOptions, WithoutId } from "mongodb";
import dayjs from "@/shared/utils/dayjs";
import type * as nv from "./noti.validator";
import type { NotificationModel } from "@/shared/database/model/notification/notification.model";
import { toObjectId } from "@/shared/services/mongodb/helper";
import { NotificationColl } from "@/shared/loaders/mongo";
import { AppError } from "@/shared/utils/error";
import NotificationRepo from "./noti.repo";

const create = async (ctx: Context, request: nv.CreateRequest): Promise<nv.CreateResponse> => {
	const newNotification: WithoutId<NotificationModel> = {
		title: request.title,
		read: false,
		type: request.type,
		payload: request.payload,
		accountId: toObjectId(request.accountId ?? ctx.get("user")._id),
		createdAt: dayjs().toDate(),
	};
	const created = await NotificationColl.insertOne(newNotification);

	return created.insertedId;
};

const bulkCreate = async (ctx: Context, request: nv.CreateRequest[], option?: UpdateOptions): Promise<boolean> => {
	for (const r of request) {
		if (!r.accountId && !r.email) {
			throw new AppError("BAD_REQUEST", "Missing accountId and Email");
		}
	}
	const now = dayjs().toDate();
	const payload = [];

	for (let i = 0; i < request.length; i++) {
		payload.push({
			...request[i],
			read: false,
			payload: request[i].payload,
			accountId: toObjectId(request[i].accountId),
			createdAt: now,
		});
	}
	const created = await NotificationColl.insertMany(payload, { ...option });

	return created.acknowledged;
};

const getNotifications = async (ctx: Context, request: nv.GetNotificationsRequest): Promise<nv.GetNotificationsResponse> => {
	const items = await NotificationRepo.findNotifications(ctx, request);
	return items;
};

const markAsRead = async (ctx: Context, request: nv.MarkAsReadRequest): Promise<boolean> => {
	if (request.markAll && request.notificationId) {
		throw new AppError("BAD_REQUEST", "Should use one criterial");
	}
	const now = dayjs().toDate();

	if (request.markAll) {
		await NotificationColl.updateMany(
			{
				accountId: toObjectId(ctx.get("user")._id),
			},
			{
				$set: { read: true, updatedAt: now },
			},
		);
	}
	if (request.notificationId) {
		await NotificationColl.updateOne(
			{
				_id: toObjectId(request.notificationId),
			},
			{
				$set: { read: true, updatedAt: now },
			},
		);
	}

	return true;
};

const deleteNotifications = async (ctx: Context, request: nv.DeleteRequest): Promise<boolean> => {
	if (request.deleteAll && request.notificationId) {
		throw new Error("Should use one criterial");
	}
	const now = dayjs().toDate();
	if (request.deleteAll) {
		await NotificationColl.updateMany(
			{
				accountId: toObjectId(ctx.get("user")._id),
			},
			{
				$set: { deletedAt: now },
			},
		);
	}
	if (request.notificationId) {
		await NotificationColl.updateOne(
			{
				_id: toObjectId(request.notificationId),
			},
			{
				$set: { deletedAt: now },
			},
		);
	}

	return true;
};

const NotificationSrv = {
	create,
	bulkCreate,
	getNotifications,
	markAsRead,
	deleteNotifications,
};

export default NotificationSrv;
