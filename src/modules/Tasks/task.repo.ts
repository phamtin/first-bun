import { ObjectId } from "mongodb";
import dayjs from "dayjs";
import { TaskColl } from "@/loaders/mongo";
import type { CreateTaskRequest, CreateTaskResponse, GetMyTasksRequest, GetTaskByIdResponse, UpdateTaskRequest, UpdateTaskResponse } from "./task.validator";

import type { ExtendTaskModel, TaskModel, TaskPriority, TaskTiming } from "../../database/model/task/task.model";
import type { Undefined } from "@/types/common.type";
import { AppError } from "@/utils/error";
import type { Context } from "hono";
import { toObjectId } from "@/pkgs/mongodb/helper";
import { EXCLUDED_TASK_STATUS } from "./task.helper";
import { toPayloadUpdate } from "@/utils/transfrom";

const getTaskById = async (ctx: Context, id: string): Promise<GetTaskByIdResponse> => {
	const res = (await TaskColl.aggregate([
		{
			$match: {
				_id: new ObjectId(id),
				deletedAt: {
					$exists: false,
				},
			},
		},
		{
			$lookup: {
				from: "accounts",
				localField: "assigneeId",
				foreignField: "_id",
				as: "assignee",
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
	]).toArray()) as [TaskModel & ExtendTaskModel];

	if (!res.length) throw new AppError("NOT_FOUND", "Task not found");

	return res[0];
};

const createTask = async (ctx: Context, request: CreateTaskRequest): Promise<CreateTaskResponse> => {
	let parsedTiming: Undefined<TaskTiming> = undefined;
	let parsedAssigneeId: Undefined<ObjectId> = undefined;

	const currentUserId = toObjectId(ctx.get("user")._id);
	const now = dayjs().toDate();

	if (request.assigneeId) {
		parsedAssigneeId = toObjectId(request.assigneeId);
	}

	if (request.timing) {
		const { startDate, endDate, estimation } = request.timing;
		parsedTiming = {};

		if (startDate) {
			parsedTiming.startDate = dayjs(startDate).toDate();
		}
		if (endDate) {
			parsedTiming.endDate = dayjs(endDate).toDate();
		}
		if (estimation) {
			parsedTiming.estimation = estimation as TaskTiming["estimation"];
		}
	}

	const data: TaskModel = {
		_id: new ObjectId(),
		title: request.title,
		status: request.status,
		priority: request.priority,
		description: request.description,
		additionalInfo: request.additionalInfo,

		assigneeId: parsedAssigneeId,
		timing: parsedTiming,
		createdAt: now,
		updatedAt: now,
		createdBy: currentUserId,
	};

	const { acknowledged } = await TaskColl.insertOne(data);

	if (!acknowledged) throw new AppError("INTERNAL_SERVER_ERROR");

	return {
		...data,
		_id: data._id,
		assigneeId: parsedAssigneeId as ObjectId,
		createdBy: currentUserId,
	};
};

const updateTask = async (ctx: Context, taskId: string, request: UpdateTaskRequest): Promise<UpdateTaskResponse> => {
	const updator: Partial<TaskModel> = {
		title: request.title,
		description: request.description,
		priority: request.priority,
		status: request.status,
		additionalInfo: request.additionalInfo,
		assigneeId: request.assigneeId ? toObjectId(request.assigneeId) : undefined,
		subTasks: request.subTasks,
	};

	if (request.timing) {
		updator.timing = {};
		const { startDate, endDate, estimation } = request.timing;

		if (startDate) {
			updator.timing.startDate = dayjs(startDate).toDate();
		}
		if (endDate) {
			updator.timing.endDate = dayjs(endDate).toDate();
		}
		if (estimation) {
			updator.timing.estimation = estimation as TaskTiming["estimation"];
		}
	}

	updator.updatedAt = dayjs().toDate();

	const updated = await TaskColl.findOneAndUpdate(
		{
			_id: toObjectId(taskId),
		},
		{
			$set: toPayloadUpdate(updator),
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
	const { query = "", startDate = [], endDate = [] } = request;

	const statusFilter = request.status?.filter((s) => !EXCLUDED_TASK_STATUS[s]) || [];

	const priorities: TaskPriority[] = request.priorities || [];

	const accountId = toObjectId(ctx.get("user")._id);

	const tasks: TaskModel[] = (await TaskColl.aggregate([
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
									$gte: [query.length, 3],
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
						//	Apply filter has startDate
						{
							$switch: {
								branches: [
									{
										case: { $eq: [startDate.length, 1] },
										then: { $gte: ["$timing.startDate", { $toDate: startDate[0] }] },
									},
									{
										case: { $eq: [startDate.length, 2] },
										then: {
											$and: [
												{
													$gte: ["$timing.startDate", { $toDate: startDate[0] }],
												},
												{
													$lte: ["$timing.startDate", { $toDate: startDate[1] }],
												},
											],
										},
									},
								],
								default: {},
							},
						},
						//	Apply filter has endDate
						{
							$switch: {
								branches: [
									{
										case: { $eq: [endDate.length, 1] },
										then: { $lte: ["$timing.endDate", { $toDate: endDate[0] }] },
									},
									{
										case: { $eq: [endDate.length, 2] },
										then: {
											$and: [
												{
													$gte: ["$timing.endDate", { $toDate: endDate[0] }],
												},
												{
													$lte: ["$timing.endDate", { $toDate: endDate[1] }],
												},
											],
										},
									},
								],
								default: {},
							},
						},
					],
				},
			},
		},
	]).toArray()) as TaskModel[];

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
