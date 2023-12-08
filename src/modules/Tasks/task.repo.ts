import { ObjectId } from "mongodb";
import dayjs from "dayjs";
import { TaskColl } from "@/loaders/mongo";
import { CreateTaskRequest, CreateTaskResponse } from "./task.validator";

import { TaskModel } from "./task.model";
import { Context } from "@/types/app.type";

const createTask = async (ctx: Context, request: CreateTaskRequest): Promise<CreateTaskResponse> => {
	const data: TaskModel = {
		_id: new ObjectId(),
		title: request.title,
		ownerId: new ObjectId(ctx.user._id),
		description: request.description,
		status: request.status,
		timing: {
			startDate: dayjs().toDate(),
			endDate: dayjs().add(1).toDate(),
			estimation: "1d.0h",
		},
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	await TaskColl.insertMany([data]);

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
