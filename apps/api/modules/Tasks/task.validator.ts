import * as v from "valibot";
import type { InferInput } from "valibot";

import { TaskPriority, TaskStatus, vExtendTaskModel, vSubTask, vTaskModel } from "@/shared/database/model/task/task.model";
import { httpGETRequestParamArray, stringObjectId, vAttributePattern } from "@/shared/types/common.type";

export const findTaskByIdRequest = v.strictObject({
	id: stringObjectId,
	select: v.optional(v.array(v.string())),
});

export const findTaskByIdResponse = v.strictObject({
	...vTaskModel.entries,
	...vExtendTaskModel.entries,
});

export const createTaskRequest = v.strictObject({
	title: v.pipe(v.string(), v.minLength(2, "Title min 2 characters long")),
	description: v.optional(v.string()),
	status: v.optional(v.enum(TaskStatus)),
	assigneeId: stringObjectId,
	folderId: stringObjectId,
	timing: v.strictObject({
		startDate: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.isoTimestamp("Timestamp is bad formatted")))),
		endDate: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.isoTimestamp("Timestamp is bad formatted")))),
		estimation: v.optional(v.nullable(v.pipe(v.number(), v.maxValue(8, "Task duration should be at most 8 hours")))),
	}),
	priority: v.optional(v.enum(TaskPriority)),
	additionalInfo: v.optional(v.array(vAttributePattern)),
	subTasks: v.optional(v.array(v.omit(vSubTask, ["_id"]))),
	tags: v.optional(v.pipe(v.array(stringObjectId), v.maxLength(9, "Too many tags"))),
});

export const createTaskResponse = vTaskModel;

export const getTasksRequest = v.strictObject({
	folderIds: v.optional(httpGETRequestParamArray(stringObjectId)),
	query: v.optional(v.string()),
	isMine: v.optional(v.union([v.literal("true"), v.literal("false")])),
	status: v.optional(httpGETRequestParamArray(v.enum(TaskStatus))),
	priorities: v.optional(httpGETRequestParamArray(v.enum(TaskPriority))),
	tags: v.optional(httpGETRequestParamArray(stringObjectId)),
	startDate: v.optional(v.pipe(v.string(), v.trim(), v.isoTimestamp("Timestamp is bad formatted"))),
	endDate: v.optional(v.pipe(v.string(), v.trim(), v.isoTimestamp("Timestamp is bad formatted"))),
	select: v.optional(httpGETRequestParamArray(v.string())),
});

export const getTasksResponse = v.array(vTaskModel);

export const updateTaskRequest = v.strictObject({
	title: v.optional(v.string()),
	description: v.optional(v.string()),
	status: v.optional(v.enum(TaskStatus)),
	assigneeId: v.optional(stringObjectId),
	priority: v.optional(v.enum(TaskPriority)),
	timing: v.optional(
		v.strictObject({
			startDate: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.isoTimestamp("Timestamp is bad formatted")))),
			endDate: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.isoTimestamp("Timestamp is bad formatted")))),
			estimation: v.optional(v.nullable(v.pipe(v.number(), v.maxValue(8, "Task duration should be at most 8 hours")))),
		}),
	),
	additionalInfo: v.optional(v.array(vAttributePattern)),
	subTasks: v.optional(
		v.array(
			v.strictObject({
				...v.omit(vSubTask, ["_id"]).entries,
				_id: v.optional(stringObjectId),
			}),
		),
	),
	tags: v.optional(v.pipe(v.array(stringObjectId), v.maxLength(9, "Too many tags"))),
});

export const updateTaskResponse = v.strictObject({
	...vTaskModel.entries,
	...vExtendTaskModel.entries,
});

export type FindTaskByIdRequest = InferInput<typeof findTaskByIdRequest>;
export type FindTaskByIdResponse = InferInput<typeof findTaskByIdResponse>;
export type CreateTaskRequest = InferInput<typeof createTaskRequest>;
export type CreateTaskResponse = InferInput<typeof createTaskResponse>;
export type GetTasksRequest = InferInput<typeof getTasksRequest>;
export type GetTasksResponse = InferInput<typeof getTasksResponse>;
export type UpdateTaskRequest = InferInput<typeof updateTaskRequest>;
export type UpdateTaskResponse = InferInput<typeof updateTaskResponse>;
