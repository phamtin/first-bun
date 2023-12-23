import { CreateTaskRequest, CreateTaskResponse, UpdateTasksRequest } from "./task.validator";

import systemLog from "@/pkgs/systemLog";
import TaskRepo from "./task.repo";
import { Context } from "@/types/app.type";
import AppError from "@/pkgs/appError/Error";
import dayjs from "@/utils/dayjs";
import { TaskColl } from "@/loaders/mongo";
import { ObjectId } from "mongodb";
import { TaskModel } from "./task.model";
import { Null, StringId } from "@/types/common.type";

const getTaskById = async (ctx: Context, id: string): Promise<Null<StringId<TaskModel>>> => {
	const task = await TaskRepo.getTaskById(ctx, id);
	return task;
};

const createTask = async (ctx: Context, request: CreateTaskRequest): Promise<CreateTaskResponse> => {
	systemLog.info("createTask - START");

	if (request.timing) {
		const { startDate, endDate } = request.timing;

		if (!dayjs(startDate).isValid()) {
			throw new AppError("BAD_REQUEST", "Timing need a start date");
		}
		if (endDate) {
			if (!dayjs(endDate).isValid()) {
				throw new AppError("BAD_REQUEST");
			}
			if (dayjs(endDate).isSameOrBefore(startDate, "minute")) {
				throw new AppError("BAD_REQUEST");
			}
		}
	}
	if (!request.status) {
		request.status = "NotStartYet";
	}

	const created = await TaskRepo.createTask(ctx, request);

	systemLog.info("createTask - END");

	return created;
};

const updateTask = async (ctx: Context, taskId: string, request: UpdateTasksRequest): Promise<boolean> => {
	systemLog.info("updateTask - START");

	if (request.timing) {
		const { startDate, endDate } = request.timing;

		if (!dayjs(startDate).isValid()) {
			throw new AppError("BAD_REQUEST", "Timing need a start date");
		}
		if (!dayjs(endDate).isValid() || dayjs(endDate).isSameOrBefore(startDate, "minute")) {
			throw new AppError("BAD_REQUEST");
		}
	}

	const taskObjectId = new ObjectId(taskId);

	const currentTask = await TaskColl.findOne({ _id: taskObjectId });

	if (!currentTask) throw new AppError("BAD_REQUEST");

	const updator: Partial<TaskModel> = {
		title: request.title,
		description: request.description,
		priority: request.priority,
		status: request.status,
		timing: request.timing,
		additionalInfo: request.additionalInfo,
	};
	if (request.tagIds) {
		updator.tagIds = request.tagIds.map((id) => new ObjectId(id));
	}

	const res = await TaskRepo.updateTask(ctx, taskObjectId, updator);

	if (!res?._id) throw new AppError("INTERNAL_SERVER_ERROR");

	systemLog.info("updateTask - END");

	return true;
};

const syncExternalToRedis = (ctx: Context, request: any) => {};

const syncTaskToDb = (ctx: Context, request: any) => {};

const TaskSrv = {
	syncTaskToDb,
	updateTask,
	syncExternalToRedis,
	createTask,
	getTaskById,
};

export default TaskSrv;
