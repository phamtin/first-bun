import type { Context } from "hono";
import dayjs from "@/utils/dayjs";

const create = async (ctx: Context, request: string): Promise<boolean> => {
	return true;
};

const getNotificationsByAccountId = async (ctx: Context, request: string): Promise<boolean> => {
	return true;
};

const markAsRead = async (ctx: Context, request: string): Promise<boolean> => {
	return true;
};

const markAsReadAll = async (ctx: Context, request: string): Promise<boolean> => {
	return true;
};

const deleteNotification = async (ctx: Context, request: string): Promise<boolean> => {
	return true;
};

const deleteNotifications = async (ctx: Context, request: string[]): Promise<boolean> => {
	return true;
};

const NotificationSrv = {
	create,
	getNotificationsByAccountId,
	markAsRead,
	markAsReadAll,
	deleteNotification,
	deleteNotifications,
};

export default NotificationSrv;
