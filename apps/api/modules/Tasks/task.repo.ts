import type { WithoutId } from "mongodb";
import dayjs from "@/shared/utils/dayjs";
import { TaskColl } from "@/shared/loaders/mongo";
import type { CreateTaskResponse, GetTasksRequest, GetTaskByIdResponse, UpdateTaskResponse } from "./task.validator";

import type { ExtendTaskModel, TaskModel, TaskPriority, TaskStatus } from "@/shared/database/model/task/task.model";
import { AppError } from "@/shared/utils/error";
import type { Context } from "hono";
import { toObjectId, toObjectIds } from "@/shared/services/mongodb/helper";
import { EXCLUDED_TASK_STATUS } from "./task.helper";
import { toPayloadUpdate } from "@/shared/utils/transfrom";

const findById = async (ctx: Context, id: string): Promise<GetTaskByIdResponse> => {
	const tasks = (await TaskColl.aggregate([
		{
			$match: {
				_id: toObjectId(id),
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

const createTask = async (ctx: Context, payload: WithoutId<TaskModel>): Promise<CreateTaskResponse> => {
	const data: WithoutId<TaskModel> = {
		...payload,

		createdAt: new Date(),
		createdBy: toObjectId(ctx.get("user")._id),
	};

	const { acknowledged, insertedId } = await TaskColl.insertOne(data);

	if (!acknowledged) throw new AppError("INTERNAL_SERVER_ERROR");

	return {
		...data,
		_id: insertedId,
	};
};

const updateTask = async (ctx: Context, taskId: string, payload: Partial<TaskModel>): Promise<UpdateTaskResponse> => {
	payload.updatedAt = dayjs().toDate();

	const unsetTiming: Record<string, true> = {};

	if (payload.timing) {
		const { startDate, endDate } = payload.timing;

		if (!startDate) {
			unsetTiming["timing.startDate"] = true;
		}
		if (!endDate) {
			unsetTiming["timing.endDate"] = true;
		}
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
	const { query = "", startDate = "", endDate = "", tags: _tags = [] } = request;

	const statusFilter = (request.status as TaskStatus[])?.filter((s) => !EXCLUDED_TASK_STATUS[s]) || [];

	const priorities: TaskPriority[] = (request.priorities as TaskPriority[]) || [];

	const accountId = toObjectId(ctx.get("user")._id);

	const isOwnerQuery = request.isOwned === "true";

	if (!isOwnerQuery) {
		if (!request.folderId) {
			throw new AppError("BAD_REQUEST", "Folder ID is required");
		}
	}

	let tasks: TaskModel[] = (await TaskColl.aggregate([
		{
			$match: {
				folderId: isOwnerQuery ? { $exists: true } : toObjectId(request.folderId),

				$or: isOwnerQuery ? [{ createdBy: accountId }, { assigneeId: accountId }] : [{ folderId: { $exists: true } }],

				deletedAt: { $exists: false },

				$expr: {
					$and: [
						//	Apply search task
						{
							$cond: {
								if: {
									$gte: [query.length, 2],
								},
								then: {
									$or: [
										{
											$regexMatch: { input: "$title", regex: query, options: "i" },
										},
										{
											$regexMatch: { input: "$description", regex: query, options: "i" },
										},
									],
								},
								else: {},
							},
						},
						//	Apply filter task status
						{
							$cond: {
								if: {
									$gte: [statusFilter.length, 1],
								},
								then: {
									$in: ["$status", statusFilter],
								},
								else: {},
							},
						},
						//	Apply filter task priority
						{
							$cond: {
								if: {
									$gte: [priorities.length, 1],
								},
								then: {
									$in: ["$priority", priorities],
								},
								else: {},
							},
						},

						startDate.length > 0
							? {
									$gte: ["$timing.startDate", { $toDate: startDate }],
								}
							: {},

						endDate.length > 0
							? {
									$lte: ["$timing.endDate", { $toDate: endDate }],
								}
							: {},
					],
				},
			},
		},
		{
			$project: {
				"assigneeInfo.accountSettings": 0,
			},
		},
		{
			$sort: { createdAt: -1 },
		},
	]).toArray()) as TaskModel[];

	if (_tags.length) {
		const tagsSet = new Set(_tags as string[]);

		tasks = tasks.filter((task) => {
			return (task.tags ?? []).some((tag) => tagsSet.has(tag.toString()));
		});
	}

	return tasks;
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

const TaskRepo = {
	createTask,
	getTasks,
	findById,
	updateTask,
	deleteTask,
};

export default TaskRepo;
