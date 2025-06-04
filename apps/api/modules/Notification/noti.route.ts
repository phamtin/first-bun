import * as v from "valibot";
import { Hono } from "hono";
import { vValidator } from "@hono/valibot-validator";
import { HTTPException } from "hono/http-exception";
import { responseOK } from "@/shared/utils/response";
import NotificationSrv from "./noti.srv";
import { getValidationErrorMsg } from "@/shared/utils/error";
import { getNotificationsRequest, markAsReadRequest, updateNotiByIdRequest } from "./noti.validator";

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
		const r = await NotificationSrv.getNotifications(c, c.req.valid("query"));
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
		const r = await NotificationSrv.markAsRead(c, c.req.valid("json"));
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
		const r = await NotificationSrv.updateNotificationById(c, {
			...c.req.valid("json"),
			notificationId: c.req.param("notificationId"),
		});
		return responseOK(c, r);
	},
);

export default notificationRoute;
