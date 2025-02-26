import type { Context } from "hono";
import type { WithoutId } from "mongodb";

import { TaskStatus, type TaskTiming, type TaskModel } from "../../database/model/task/task.model";
import type { CreateTaskRequest, UpdateTaskRequest } from "./task.validator";
import { toObjectId } from "@/pkgs/mongodb/helper";
import dayjs from "@/utils/dayjs";

export const buildPayloadCreateTask = (ctx: Context, request: CreateTaskRequest, model?: TaskModel): WithoutId<TaskModel> | undefined => {
	let res: TaskModel | undefined = undefined;

	if (Object.keys(request).length === 0) return res;

	res = {} as TaskModel;

	if (request.title) {
		res.title = request.title;
	}
	if (request.description) {
		res.description = request.description;
	}
	if (request.priority) {
		res.priority = request.priority;
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
			res.timing.estimation = estimation as TaskTiming["estimation"];
		}
	}

	res.projectId = toObjectId(request.projectId);

	res.status = request.status ?? TaskStatus.NotStartYet;

	res.tags = [];

	res.createdAt = dayjs().toDate();

	res.createdBy = toObjectId(ctx.get("user")._id);

	return res;
};

export const buildPayloadUpdateTask = (ctx: Context, request: UpdateTaskRequest, model?: TaskModel): WithoutId<TaskModel> | undefined => {
	let res: TaskModel | undefined = undefined;

	if (Object.keys(request).length === 0) return res;

	res = {} as TaskModel;

	if (request.title) {
		res.title = request.title;
	}
	if (request.description) {
		res.description = request.description;
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
		}
		if (endDate) {
			res.timing.endDate = dayjs(endDate).toDate();
		}
		if (estimation) {
			res.timing.estimation = estimation as TaskTiming["estimation"];
		}
	}

	return res;
};
