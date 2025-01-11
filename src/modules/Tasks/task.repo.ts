import type { WithoutId } from "mongodb";
import dayjs from "dayjs";
import { TaskColl } from "@/loaders/mongo";
import type { CreateTaskResponse, GetMyTasksRequest, GetTaskByIdResponse, UpdateTaskResponse } from "./task.validator";

import type { ExtendTaskModel, TaskModel, TaskPriority, TaskStatus } from "../../database/model/task/task.model";
import { AppError } from "@/utils/error";
import type { Context } from "hono";
import { toObjectId } from "@/pkgs/mongodb/helper";
import { EXCLUDED_TASK_STATUS } from "./task.helper";
import { toPayloadUpdate } from "@/utils/transfrom";

const getTaskById = async (ctx: Context, id: string): Promise<GetTaskByIdResponse> => {
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
				from: "projects",
				localField: "projectId",
				foreignField: "_id",
				as: "availableTags",
				pipeline: [{ $project: { _id: 0, tags: 1 } }],
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
				preserveNullAndEmptyArrays: true,
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

	if (tasks.length > 1) throw new AppError("INTERNAL_SERVER_ERROR", "Something went wrong");

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

	const updated = await TaskColl.findOneAndUpdate(
		{
			_id: toObjectId(taskId),
		},
		{
			$set: toPayloadUpdate(payload),
		},
		{
			ignoreUndefined: true,
			returnDocument: "after",
		}
	);

	if (!updated) throw new AppError("INTERNAL_SERVER_ERROR");

	return getTaskById(ctx, taskId);
};

const getMyTasks = async (ctx: Context, request: GetMyTasksRequest): Promise<TaskModel[]> => {
	const { query = "", startDate = "", endDate = "", tags: _tags = [] } = request;

	const statusFilter = (request.status as TaskStatus[])?.filter((s) => !EXCLUDED_TASK_STATUS[s]) || [];

	const priorities: TaskPriority[] = (request.priorities as TaskPriority[]) || [];

	const accountId = toObjectId(ctx.get("user")._id);

	let tasks: TaskModel[] = (await TaskColl.aggregate([
		{
			$match: {
				$or: [{ createdBy: accountId }, { assigneeId: accountId }],

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
	]).toArray()) as TaskModel[];

	if (_tags.length) {
		const tagsSet = new Set(_tags as string[]);

		tasks = tasks.filter((task) => {
			for (let i = 0; i < (task?.tags?.length || 0); i++) {
				if (tagsSet.has(task.tags?.[i].toString() as string)) {
					return true;
				}
			}
			return false;
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
		}
	);

	return !!res?.deletedAt;
};

const TaskRepo = {
	createTask,
	getMyTasks,
	getTaskById,
	updateTask,
	deleteTask,
};

export default TaskRepo;
