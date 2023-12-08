import { CreateTaskRequest, CreateTaskResponse } from "./task.validator";

import systemLog from "@/pkgs/systemLog";
import TaskRepo from "./task.repo";
import { Context } from "@/types/app.type";

const getTask = async (ctx: Context) => {
	return [];
};

const createTask = async (ctx: Context, request: CreateTaskRequest): Promise<CreateTaskResponse> => {
	systemLog.info("createTask - START");

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
