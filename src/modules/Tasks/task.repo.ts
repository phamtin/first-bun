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
		ownerId: new ObjectId(),
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

	const inserted = await TaskColl.insertMany([data]);

	console.log(inserted.insertedCount);

	return {
		...data,
		_id: data._id.toHexString(),
		ownerId: data._id.toHexString(),
	};
};

const getTask = (ctx: Context, request: any) => {};

const TaskRepo = {
	createTask,
	getTask,
};

export default TaskRepo;
