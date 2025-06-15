import type { Context } from "@/shared/types/app.type";
import type { Filter } from "mongodb";
import { toObjectId } from "@/shared/services/mongodb/helper";
import type { NotificationModel, NotificationType } from "@/shared/database/model/notification/notification.model";
import { NotificationColl } from "@/shared/loaders/mongo";
import type * as nv from "./noti.validator";
import dayjs from "@/shared/utils/dayjs";
import { toPayloadUpdate } from "@/shared/utils/transfrom";

const findNotifications = async (ctx: Context, request: nv.GetNotificationsRequest): Promise<NotificationModel<NotificationType>[]> => {
	const query: Filter<NotificationModel<NotificationType>> = {
		accountId: request.accountId ? toObjectId(request.accountId) : toObjectId(ctx.user._id),
	};

	if (request.createdFrom) {
		query.createdAt = {
			$gte: dayjs(request.createdFrom).toDate(),
		};
	}
	if (request.createdTo) {
		query.createdAt = {
			$lte: dayjs(request.createdTo).toDate(),
		};
	}

	return NotificationColl.find(query, { sort: { createdAt: -1 } }).toArray();
};

const updateNotificationById = async (ctx: Context, request: nv.UpdateNotiByIdRequest): Promise<boolean> => {
	const payload = toPayloadUpdate(request);

	payload.updatedAt = dayjs().toDate();
	payload.updatedBy = toObjectId(ctx.user._id);

	const updated = await NotificationColl.updateOne(
		{
			_id: toObjectId(request.notificationId),
		},
		{
			$set: payload,
		},
		{ ignoreUndefined: true },
	);

	return updated.acknowledged;
};

const updateNotifications = async (
	ctx: Context,
	request: {
		filter: Filter<NotificationModel<NotificationType>>;
		payload: nv.UpdateNotificationsRequest;
	},
): Promise<boolean> => {
	const { filter, payload } = request;

	const updated = await NotificationColl.updateMany(
		filter,
		{
			$set: {
				...toPayloadUpdate(payload),
				updatedAt: dayjs().toDate(),
			},
		},
		{ ignoreUndefined: true },
	);

	return updated.acknowledged;
};

const NotificationRepo = {
	findNotifications,
	updateNotificationById,
	updateNotifications,
};

export default NotificationRepo;
