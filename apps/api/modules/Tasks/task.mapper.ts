import type { Context } from "@/shared/types/app.type";
import type { WithoutId } from "mongodb";

import { TaskStatus, type TaskTiming, type TaskModel, TaskPriority } from "@/shared/database/model/task/task.model";
import type { CreateTaskRequest, UpdateTaskRequest } from "./task.validator";
import { toObjectId } from "@/shared/services/mongodb/helper";
import dayjs from "@/shared/utils/dayjs";

export const buildPayloadCreateTask = (ctx: Context, request: CreateTaskRequest, model?: TaskModel): WithoutId<TaskModel> | undefined => {
	let res: TaskModel | undefined ;

	if (Object.keys(request).length === 0) return res;

	res = {} as TaskModel;

	if (request.title) {
		res.title = request.title;
	}
	if (request.description) {
		res.description = request.description;
	}
	if (request.description) {
		res.description = request.description;
	}
	if (request.additionalInfo) {
		res.additionalInfo = request.additionalInfo;
	}
	if (request.timing) {
		const { startDate, endDate, estimation } = request.timing;

		res.timing = {};

		if (startDate) {
			res.timing.startDate = dayjs(startDate).toDate();
		}
		if (endDate) {
			res.timing.endDate = dayjs(endDate).toDate();
		}
		if (estimation) {
			res.timing.estimation = estimation;
		}
	}

	res.priority = request.priority ?? TaskPriority.Low;

	res.folderId = toObjectId(request.folderId);

	res.status = request.status ?? TaskStatus.NotStartYet;

	res.tags = [];

	res.createdAt = dayjs().toDate();

	res.createdBy = toObjectId(ctx.user._id);

	return res;
};

export const buildPayloadUpdateTask = (ctx: Context, request: UpdateTaskRequest, model?: TaskModel): WithoutId<TaskModel> => {
	let res: TaskModel = {} as TaskModel;

	if (Object.keys(request).length === 0) return res;

	res = {} as TaskModel;

	if (request.title) {
		res.title = request.title;
	}
	if (request.description) {
		res.description = request.description;
	} else if (request.description === "") {
		res.description = "";
	}
	if (request.status) {
		res.status = request.status;
	}
	if (request.priority) {
		res.priority = request.priority;
	}
	if (request.additionalInfo) {
		res.additionalInfo = request.additionalInfo;
	}
	if (request.timing) {
		const { startDate, endDate, estimation } = request.timing;

		res.timing = {};

		if (startDate) {
			res.timing.startDate = dayjs(startDate).toDate();
		} else if (startDate === null) {
			res.timing.startDate = null;
		}
		if (endDate) {
			res.timing.endDate = dayjs(endDate).toDate();
		} else if (endDate === null) {
			res.timing.endDate = null;
		}
		if (estimation) {
			res.timing.estimation = estimation satisfies TaskTiming["estimation"];
		} else if (estimation === null) {
			res.timing.estimation = null;
		}
	}

	return res;
};
