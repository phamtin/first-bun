import { ObjectId } from "mongodb";
import { TaskColl } from "@/loaders/mongo";
import { CreateTaskRequest, CreateTaskResponse } from "./task.validator";

import { TaskModel, TaskTiming } from "./task.model";
import { Context } from "@/types/app.type";
import { Undefined } from "@/types/common.type";

const createTask = async (ctx: Context, request: CreateTaskRequest): Promise<CreateTaskResponse> => {
	let parsedTiming: Undefined<TaskTiming> = undefined;

	if (request.timing) {
		parsedTiming = {};
		parsedTiming.startDate = new Date(request.timing.startDate);

		if (request.timing.endDate) {
			parsedTiming.endDate = new Date(request.timing.endDate);
		}
	}

	const now = new Date();

	const data: TaskModel = {
		_id: new ObjectId(),
		title: request.title,
		status: request.status,
		ownerId: new ObjectId(ctx.user._id),
		description: request.description,
		additionalInfo: request.additionalInfo,
		timing: parsedTiming,
		createdAt: now,
		updatedAt: now,
	};

	await TaskColl.insertOne(data);

	return {
		...data,
		_id: data._id.toHexString(),
		ownerId: ctx.user._id,
	};
};

const getTask = (ctx: Context, request: any) => {};

const TaskRepo = {
	createTask,
	getTask,
};

export default TaskRepo;
