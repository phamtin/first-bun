import { ObjectId } from "mongodb";
import { TaskColl } from "@/loaders/mongo";
import { CreateTaskRequest, CreateTaskResponse } from "./task.validator";

import { TaskModel, TaskTiming } from "./task.model";
import { Context } from "@/types/app.type";
import { Null, StringId, Undefined } from "@/types/common.type";
import AppError from "@/pkgs/appError/Error";

const getTaskById = async (ctx: Context, id: string): Promise<Null<StringId<TaskModel>>> => {
	const res = await TaskColl.findOne({
		_id: new ObjectId(id),
	});

	if (!res) return null;

	return {
		...res,
		_id: id,
		title: res.title,
		ownerId: res.ownerId.toHexString(),
		tags: res.tags?.map((item) => ({ ...item, _id: item._id.toHexString() })),
	};
};

const createTask = async (ctx: Context, request: CreateTaskRequest): Promise<CreateTaskResponse> => {
	let parsedTiming: Undefined<TaskTiming> = undefined;

	if (request.timing) {
		const { startDate, endDate, estimation } = request.timing;
		parsedTiming = {};

		if (startDate) {
			parsedTiming.startDate = new Date(startDate);
		}
		if (endDate) {
			parsedTiming.endDate = new Date(endDate);
		}
		if (estimation) {
			parsedTiming.estimation = estimation as TaskTiming["estimation"];
		}
	}

	const ObjectIdTags = (request.tags ?? []).map((t) => ({ ...t, _id: new ObjectId(t._id) }));

	const now = new Date();

	const data: TaskModel = {
		_id: new ObjectId(),
		title: request.title,
		status: request.status!,
		ownerId: new ObjectId(ctx.user._id),
		description: request.description,
		additionalInfo: request.additionalInfo,
		priority: request.priority,

		timing: parsedTiming,
		tags: ObjectIdTags,
		createdAt: now,
		updatedAt: now,
	};

	const { acknowledged } = await TaskColl.insertOne(data);

	if (!acknowledged) throw new AppError("INTERNAL_SERVER_ERROR");

	return {
		...data,
		_id: data._id.toHexString(),
		ownerId: ctx.user._id,
		tags: request.tags,
	};
};

const updateTask = async (ctx: Context, taskId: ObjectId, request: Partial<TaskModel>): Promise<Null<TaskModel>> => {
	const updated = await TaskColl.findOneAndUpdate(
		{
			_id: taskId,
		},
		{
			$set: {
				title: request.title,
				status: request.status,
				timing: request.timing,
				tags: request.tags,
				priority: request.priority,
				description: request.description,
				additionalInfo: request.additionalInfo,
			},
		},
		{
			ignoreUndefined: true,
			returnDocument: "after",
		}
	);

	return updated;
};

const TaskRepo = {
	createTask,
	getTaskById,
	updateTask,
};

export default TaskRepo;
