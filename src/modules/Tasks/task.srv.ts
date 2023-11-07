import { CreateTaskRequest, CreateTaskResponse } from "./task.validator";

import systemLog from "@/pkgs/systemLog";
import TaskRepo from "./task.repo";
import { Context } from "@/types/app.type";

const getTask = (ctx: Context, request: any) => {};

const createTask = async (ctx: Context, request: CreateTaskRequest): Promise<CreateTaskResponse> => {
	systemLog.info("createTask - START");

	const created = await TaskRepo.createTask(ctx, request);

	systemLog.info("createTask - END");

	return created;
};
const updateTransaction = (ctx: Context, request: any) => {};

const syncExternalToRedis = (ctx: Context, request: any) => {};

const syncTransactionToDb = (ctx: Context, request: any) => {};

const TaskSrv = {
	syncTransactionToDb,
	updateTransaction,
	syncExternalToRedis,
	createTask,
	getTask,
};

export default TaskSrv;
