import { CreateTaskRequest, CreateTaskResponse } from "./task.validator";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

import systemLog from "@/pkgs/systemLog";
import TaskRepo from "./task.repo";
import { Context } from "@/types/app.type";
import AppError from "@/pkgs/appError/Error";
import dayjs from "dayjs";

dayjs.extend(isSameOrBefore);

const getTask = async (ctx: Context) => {
	return [];
};

const createTask = async (ctx: Context, request: CreateTaskRequest): Promise<CreateTaskResponse> => {
	systemLog.info("createTask - START");

	if (request.timing) {
		const { startDate, endDate } = request.timing;

		if (!startDate) {
			throw new AppError("BAD_REQUEST", "Timing need a start date");
		}
		if (endDate) {
			if (dayjs(endDate).isSameOrBefore(startDate, "minute")) {
				throw new AppError("BAD_REQUEST");
			}
		}
	}

	const created = await TaskRepo.createTask(ctx, request);

	systemLog.info("createTask - END");

	return created;
};
const updateTask = (ctx: Context, request: any) => {};

const syncExternalToRedis = (ctx: Context, request: any) => {};

const syncTaskToDb = (ctx: Context, request: any) => {};

const TaskSrv = {
	syncTaskToDb,
	updateTask,
	syncExternalToRedis,
	createTask,
	getTask,
};

export default TaskSrv;
