import type { Context } from "hono";
import type { Filter } from "mongodb";
import { toObjectId } from "@/shared/services/mongodb/helper";
import type { NotificationModel } from "@/shared/database/model/notification/notification.model";
import { NotificationColl } from "@/shared/loaders/mongo";
import type * as nv from "./noti.validator";
import dayjs from "@/shared/utils/dayjs";

const findNotifications = async (ctx: Context, request: nv.GetNotificationsRequest): Promise<NotificationModel[]> => {
	const query: Filter<NotificationModel> = {
		accountId: toObjectId(ctx.get("user")._id),
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

	return NotificationColl.find(query).toArray();
};
const NotificationRepo = {
	findNotifications,
};

export default NotificationRepo;
