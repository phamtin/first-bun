import type { Condition, Filter, FindOptions, InsertOneOptions, WithoutId } from "mongodb";
import dayjs from "@/shared/utils/dayjs";
import { TaskColl } from "@/shared/loaders/mongo";
import type { CreateTaskResponse, GetTasksRequest, GetTaskByIdResponse, UpdateTaskResponse } from "./task.validator";

import { type ExtendTaskModel, type TaskModel, type TaskPriority, TaskStatus } from "@/shared/database/model/task/task.model";
import { AppError } from "@/shared/utils/error";
import type { Context } from "hono";
import { toObjectId } from "@/shared/services/mongodb/helper";
import { buildActivities, EXCLUDED_TASK_STATUS } from "./task.helper";
import { toPayloadUpdate } from "@/shared/utils/transfrom";

const findById = async (ctx: Context, id: string): Promise<GetTaskByIdResponse> => {
	const tasks = (await TaskColl.aggregate([
		{
			$match: {
				_id: toObjectId(id),

				status: {
					$ne: TaskStatus.Archived,
				},
				deletedAt: {
					$exists: false,
				},
			},
		},
		{
			$lookup: {
				from: "accounts",
				localField: "createdBy",
				foreignField: "_id",
				as: "created",
			},
		},
		{
			$unwind: {
				path: "$created",
			},
		},
		{
			$lookup: {
				from: "folders",
				localField: "folderId",
				foreignField: "_id",
				as: "availableTags",
				pipeline: [{ $project: { tags: 1 } }],
			},
		},
		{
			$replaceRoot: {
				newRoot: { $mergeObjects: ["$$ROOT", { availableTags: "$availableTags.tags" }] },
			},
		},
		{
			$unwind: {
				path: "$availableTags",
			},
		},
		{
			$project: {
				"created.accountSettings": 0,
				"assigneeInfo.accountSettings": 0,
			},
		},
	]).toArray()) as (TaskModel & ExtendTaskModel)[];

	if (tasks.length === 0) throw new AppError("NOT_FOUND", "Task not found");

	return tasks[0];
};

const createTask = async (ctx: Context, payload: WithoutId<TaskModel>, opt?: InsertOneOptions): Promise<CreateTaskResponse> => {
	const data: WithoutId<TaskModel> = {
		...payload,

		createdAt: new Date(),
		createdBy: toObjectId(ctx.get("user")._id),
	};

	const { acknowledged, insertedId } = await TaskColl.insertOne(data, opt);

	if (!acknowledged) throw new AppError("INTERNAL_SERVER_ERROR");

	return {
		...data,
		_id: insertedId,
	};
};

const updateTask = async (ctx: Context, taskId: string, payload: Partial<TaskModel>, model?: TaskModel): Promise<UpdateTaskResponse> => {
	payload.updatedAt = dayjs().toDate();

	const unsetTiming: Record<string, true> = {};

	if (payload.timing) {
		const { startDate, endDate, estimation } = payload.timing;

		if (startDate === null) {
			unsetTiming["timing.startDate"] = true;
		}
		if (endDate === null) {
			unsetTiming["timing.endDate"] = true;
		}
		if (estimation === null) {
			unsetTiming["timing.estimation"] = true;
		}
	}

	if (model) {
		const activities = buildActivities(ctx.get("user"), payload, model);
		payload.activities = activities.concat(model.activities || []);
	}

	const updated = await TaskColl.findOneAndUpdate(
		{
			_id: toObjectId(taskId),
		},
		{
			$set: toPayloadUpdate(payload),
			$unset: unsetTiming,
		},
		{
			ignoreUndefined: true,
			returnDocument: "after",
		},
	);

	if (!updated) throw new AppError("INTERNAL_SERVER_ERROR");

	return findById(ctx, taskId);
};

const getTasks = async (ctx: Context, request: GetTasksRequest): Promise<TaskModel[]> => {
	const accountId = toObjectId(ctx.get("user")._id);

	const filter: Filter<TaskModel> = {
		status: {
			$ne: TaskStatus.Archived,
		},
		deletedAt: {
			$exists: false,
		},
	};

	if ((request.query?.length || 0) > 1) {
		const regexQuery: Condition<string> = { $regex: request.query, $options: "i" };

		filter.$or = [{ title: regexQuery }, { description: regexQuery }];
	}

	if (request.isMine) {
		filter.assigneeInfo = { $elemMatch: { _id: accountId } };
	}

	if (request.folderIds.length) {
		filter.folderId = {
			$in: request.folderIds.map((id) => toObjectId(id)),
		};
	}

	if (request.status?.length) {
		filter.status = {
			$in: request.status,
		};
	}

	if (request.priorities?.length) {
		filter.priority = {
			$in: request.priorities,
		};
	}

	if (request.startDate) {
		filter["timing.startDate"] = {
			$gte: dayjs(request.startDate).toDate(),
		};
	}

	if (request.endDate) {
		filter["timing.endDate"] = {
			$lte: dayjs(request.endDate).toDate(),
		};
	}

	if (request.tags?.length) {
		filter.tags = {
			$in: request.tags.map((id) => toObjectId(id)),
		};
	}

	const queryOptions: FindOptions<TaskModel> = {
		limit: 10000,
		sort: {
			createdAt: -1,
		},
	};

	return await TaskColl.find(filter, queryOptions).toArray();
};

const deleteTask = async (ctx: Context, taskId: string): Promise<boolean> => {
	const res = await TaskColl.findOneAndUpdate(
		{
			_id: toObjectId(taskId),
		},
		{
			$set: {
				deletedAt: dayjs().toDate(),
				deletedBy: toObjectId(ctx.get("user")._id),
			},
		},
		{
			returnDocument: "after",
		},
	);

	return !!res?.deletedAt;
};

const findTasksByFolderIds = async (ctx: Context, folderIds: string[], opt?: FindOptions<TaskModel>): Promise<TaskModel[]> => {
	if (!folderIds?.length) return [];

	const filter: Filter<TaskModel> = {
		status: {
			$ne: TaskStatus.Archived,
		},
		deletedAt: {
			$exists: false,
		},
	};

	if (folderIds.length === 1) {
		filter.folderId = toObjectId(folderIds[0]);
	} else {
		filter.folderId = {
			$in: folderIds.map((id) => toObjectId(id)),
		};
	}

	return await TaskColl.find(filter, opt).toArray();
};

const TaskRepo = {
	createTask,
	getTasks,
	findById,
	updateTask,
	deleteTask,
	findTasksByFolderIds,
};

export default TaskRepo;
