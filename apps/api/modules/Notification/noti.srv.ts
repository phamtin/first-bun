import type { Context } from "hono";
import type { Filter, UpdateOptions, WithoutId } from "mongodb";
import dayjs from "@/shared/utils/dayjs";
import type * as nv from "./noti.validator";
import type { NotificationModel, NotificationType } from "@/shared/database/model/notification/notification.model";
import { toObjectId } from "@/shared/services/mongodb/helper";
import { NotificationColl } from "@/shared/loaders/mongo";
import { AppError } from "@/shared/utils/error";
import NotificationRepo from "./noti.repo";
import { NotificationBuilderFactory } from "./noti.util";
import { APINatsPublisher } from "@/api/init-nats";
import { NatsEvent } from "@/shared/nats/types/events";

const create = async (ctx: Context, request: nv.CreateRequest): Promise<nv.CreateResponse> => {
	const newNotification: WithoutId<NotificationModel<NotificationType>> = {
		title: request.title,
		type: request.type,
		payload: NotificationBuilderFactory(request.type, request.payload),
		accountId: toObjectId(request.accountId ?? ctx.get("user")._id),
		read: false,
		createdAt: dayjs().toDate(),
	};

	const created = await NotificationColl.insertOne(newNotification);

	if (!created.acknowledged) throw new AppError("INTERNAL_SERVER_ERROR", "Internal Server Error");

	await APINatsPublisher.publish<(typeof NatsEvent)["Notifications"]["Created"]>(NatsEvent.Notifications.Created, {
		...newNotification,
		_id: created.insertedId,
	});

	return created.insertedId;
};

const updateNotificationById = async (ctx: Context, request: nv.UpdateNotiByIdRequest): Promise<boolean> => {
	const updated = await NotificationRepo.updateNotificationById(ctx, request);

	return updated;
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
			payload: NotificationBuilderFactory(request[i].type, request[i].payload),
			accountId: toObjectId(request[i].accountId),
			createdAt: now,
		});
	}
	const created = await NotificationColl.insertMany(payload, { ...option });

	return created.acknowledged;
};

const getNotifications = async (ctx: Context, request: nv.GetNotificationsRequest): Promise<NotificationModel<NotificationType>[]> => {
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
	if ((request.deleteAll && request.notificationId) || (!request.deleteAll && !request.notificationId)) {
		throw new AppError("BAD_REQUEST", "Should use one criterial");
	}
	if (request.deleteAll) {
		await NotificationColl.updateMany(
			{
				accountId: toObjectId(ctx.get("user")._id),
			},
			{
				$set: { deletedAt: dayjs().toDate() },
			},
		);
	}
	if (request.notificationId) {
		await NotificationColl.updateOne(
			{
				_id: toObjectId(request.notificationId),
			},
			{
				$set: { deletedAt: dayjs().toDate() },
			},
		);
	}

	return true;
};

const updateNotifications = async (
	ctx: Context,
	request: {
		filter: Filter<NotificationModel<NotificationType>>;
		payload: nv.UpdateNotificationsRequest;
	},
): Promise<boolean> => {
	const updated = await NotificationRepo.updateNotifications(ctx, {
		filter: request.filter,
		payload: request.payload,
	});

	return updated;
};

const NotificationSrv = {
	create,
	updateNotificationById,
	updateNotifications,
	bulkCreate,
	getNotifications,
	markAsRead,
	deleteNotifications,
};

export default NotificationSrv;
