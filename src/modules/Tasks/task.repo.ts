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
		tagIds: res.tagIds?.map((id) => id.toHexString()),
	};
};

const createTask = async (ctx: Context, request: CreateTaskRequest): Promise<CreateTaskResponse> => {
	let parsedTiming: Undefined<TaskTiming> = undefined;

	if (request.timing) {
		const { startDate, endDate } = request.timing;
		parsedTiming = {};

		if (startDate) {
			parsedTiming.startDate = new Date(startDate);
		}
		if (endDate) {
			parsedTiming.endDate = new Date(endDate);
		}
	}

	const tagIdsObjectId = (request.tagIds ?? []).map((t) => new ObjectId(t));

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
		tagIds: tagIdsObjectId,
		createdAt: now,
		updatedAt: now,
	};

	const { acknowledged } = await TaskColl.insertOne(data);

	if (!acknowledged) throw new AppError("INTERNAL_SERVER_ERROR");

	return {
		...data,
		_id: data._id.toHexString(),
		ownerId: ctx.user._id,
		tagIds: request.tagIds,
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
				tagIds: request.tagIds,
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
