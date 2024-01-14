import { CreateTaskRequest, CreateTaskResponse, UpdateTasksRequest } from "./task.validator";

import systemLog from "@/pkgs/systemLog";
import TaskRepo from "./task.repo";
import { Context } from "@/types/app.type";
import AppError from "@/pkgs/appError/Error";
import dayjs from "@/utils/dayjs";
import { TaskColl } from "@/loaders/mongo";
import { ObjectId } from "mongodb";
import { TaskModel, TaskTiming } from "./task.model";
import { Null, StringId } from "@/types/common.type";
import AccountSrv from "../Accounts/account.srv";
import { TaskTagModel } from "../Tags/tag.model";

const getTaskById = async (ctx: Context, id: string): Promise<Null<StringId<TaskModel>>> => {
	const task = await TaskRepo.getTaskById(ctx, id);
	return task;
};

const createTask = async (ctx: Context, request: CreateTaskRequest): Promise<CreateTaskResponse> => {
	systemLog.info("createTask - START");

	if (request.timing) {
		const { startDate, endDate } = request.timing;

		if (startDate) {
			if (!dayjs(startDate).isValid()) {
				throw new AppError("BAD_REQUEST");
			}
		}
		if (endDate) {
			const headOfTime = startDate ?? new Date();

			if (!dayjs(endDate).isValid()) {
				throw new AppError("BAD_REQUEST");
			}
			if (dayjs(endDate).isSameOrBefore(headOfTime, "second")) {
				throw new AppError("BAD_REQUEST", "End start is invalid");
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

	const [userProfile, task] = await Promise.all([AccountSrv.getProfile(ctx), TaskColl.findOne({ _id: new ObjectId(taskId) })]);

	if (!userProfile || !task) throw new AppError("NOT_FOUND");

	if (request.timing) {
		const { startDate, endDate } = request.timing;
		const headOfTime = startDate ?? new Date();

		if (!dayjs(startDate).isValid()) {
			throw new AppError("BAD_REQUEST", "Timing need a start date");
		}
		if (!dayjs(endDate).isValid() || dayjs(endDate).isSameOrBefore(headOfTime, "second")) {
			throw new AppError("BAD_REQUEST");
		}
	}
	const updator: Partial<TaskModel> = {
		title: request.title,
		description: request.description,
		priority: request.priority,
		status: request.status,
		additionalInfo: request.additionalInfo,
	};
	if (request.timing) {
		updator.timing = {};
		const { startDate, endDate, estimation } = request.timing;

		if (startDate) updator.timing.startDate = new Date(startDate);
		if (endDate) updator.timing.endDate = new Date(endDate);
		if (estimation) updator.timing.estimation = estimation as TaskTiming["estimation"];
	}
	if (Array.isArray(request.tags)) {
		const tagsToUpdate: TaskTagModel[] = [];
		request.tags.forEach((tag) => {
			if (!userProfile.profileInfo.tags?.[tag._id]) return;
			const { _id, title, color } = userProfile.profileInfo.tags[tag._id];
			tagsToUpdate.push({ _id: new ObjectId(_id), title, color });
		});
		updator.tags = tagsToUpdate;
	}

	const res = await TaskRepo.updateTask(ctx, new ObjectId(taskId), updator);

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
