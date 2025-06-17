import * as v from "valibot";
import { Hono } from "hono";
import { vValidator } from "@hono/valibot-validator";
import { HTTPException } from "hono/http-exception";
import { responseOK } from "@/shared/utils/response";
import NotificationSrv from "./noti.srv";
import { getValidationErrorMsg } from "@/shared/utils/error";
import { deleteRequest, getNotificationsRequest, markAsReadRequest, updateNotiByIdRequest } from "./noti.validator";
import { AppContext } from "@/shared/utils/transfrom";

const notificationRoute = new Hono();

/**
 * 	Get notifications
 */
notificationRoute.get(
	"/",
	vValidator("query", getNotificationsRequest, (result) => {
		if (!result.success) {
			throw new HTTPException(400, { message: getValidationErrorMsg(result.issues) });
		}
	}),
	async (c) => {
		const r = await NotificationSrv.getNotifications(AppContext(c), c.req.valid("query"));
		return responseOK(c, r);
	},
);

/**
 * 	Mark notification as read
 */
notificationRoute.patch(
	"/mark-read",
	vValidator("json", markAsReadRequest, (result) => {
		if (!result.success) {
			throw new HTTPException(400, { message: getValidationErrorMsg(result.issues) });
		}
	}),
	async (c) => {
		const r = await NotificationSrv.markAsRead(AppContext(c), c.req.valid("json"));
		return responseOK(c, r);
	},
);

/**
 * 	Update notification by id
 */
notificationRoute.patch(
	"/:notificationId",
	vValidator("json", v.omit(updateNotiByIdRequest, ["notificationId"]), (result) => {
		if (!result.success) {
			throw new HTTPException(400, { message: getValidationErrorMsg(result.issues) });
		}
	}),
	async (c) => {
		if (!c.req.param("notificationId")) {
			throw new HTTPException(400, { message: "Notification ID is required" });
		}
		const r = await NotificationSrv.updateNotificationById(AppContext(c), {
			...c.req.valid("json"),
			notificationId: c.req.param("notificationId"),
		});
		return responseOK(c, r);
	},
);

/**
 * 	Delete notification by ID
 */
notificationRoute.post(
	"/delete",
	vValidator("json", deleteRequest, (result) => {
		if (!result.success) {
			throw new HTTPException(400, { message: getValidationErrorMsg(result.issues) });
		}
	}),
	async (c) => {
		const r = await NotificationSrv.deleteNotifications(AppContext(c), c.req.valid("json"));
		return responseOK(c, r);
	},
);

export default notificationRoute;
