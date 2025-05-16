import * as v from "valibot";
import type { InferInput } from "valibot";

import { TaskPriority, TaskStatus, vExtendTaskModel, vSubTask, vTaskModel } from "@/shared/database/model/task/task.model";
import { stringObjectId, vAttributePattern } from "@/shared/types/common.type";

export const createTaskRequest = v.strictObject({
	title: v.pipe(v.string(), v.minLength(2, "Title min 2 characters long")),
	description: v.optional(v.string()),
	status: v.optional(v.enum(TaskStatus)),
	assigneeId: v.optional(stringObjectId),
	folderId: stringObjectId,
	timing: v.strictObject({
		startDate: v.optional(v.pipe(v.string(), v.isoTimestamp("Timestamp is badly formatted"))),
		endDate: v.optional(v.pipe(v.string(), v.isoTimestamp("Timestamp is badly formatted"))),
		estimation: v.optional(v.string()),
	}),
	priority: v.optional(v.enum(TaskPriority)),
	additionalInfo: v.optional(v.array(vAttributePattern)),
	subTasks: v.optional(v.array(v.omit(vSubTask, ["_id"]))),
	tags: v.optional(v.pipe(v.array(stringObjectId), v.maxLength(9, "Too many tags"))),
});

export const createTaskResponse = vTaskModel;

export const getTasksRequest = v.strictObject({
	folderId: v.optional(stringObjectId),
	query: v.optional(v.string()),
	status: v.pipe(
		v.optional(v.union([v.array(v.enum(TaskStatus)), v.enum(TaskStatus)])),
		v.transform((input) => (Array.isArray(input) ? input : [input]).filter((i) => !!i)),
	),
	priorities: v.pipe(
		v.optional(v.union([v.array(v.enum(TaskPriority)), v.enum(TaskPriority)])),
		v.transform((input) => (Array.isArray(input) ? input : [input]).filter((i) => !!i)),
	),
	startDate: v.optional(v.pipe(v.string(), v.isoTimestamp("Timestamp is badly formatted"))),
	endDate: v.optional(v.pipe(v.string(), v.isoTimestamp("Timestamp is badly formatted"))),
	tags: v.pipe(
		v.optional(v.union([v.array(stringObjectId), stringObjectId])),
		v.transform((input) => (Array.isArray(input) ? input : [input]).filter((i) => !!i)),
	),
	isOwned: v.optional(v.union([v.literal("true"), v.literal("false")])),
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
			startDate: v.optional(v.pipe(v.string(), v.isoTimestamp("Timestamp is badly formatted"))),
			endDate: v.optional(v.pipe(v.string(), v.isoTimestamp("Timestamp is badly formatted"))),
			estimation: v.optional(v.string()),
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

export const getTaskByIdRequest = v.strictObject({
	taskId: stringObjectId,
});

export const getTaskByIdResponse = v.strictObject({
	...vTaskModel.entries,
	...vExtendTaskModel.entries,
});

export type CreateTaskRequest = InferInput<typeof createTaskRequest>;
export type CreateTaskResponse = InferInput<typeof createTaskResponse>;
export type GetTasksRequest = InferInput<typeof getTasksRequest>;
export type GetTasksResponse = InferInput<typeof getTasksResponse>;
export type UpdateTaskRequest = InferInput<typeof updateTaskRequest>;
export type UpdateTaskResponse = InferInput<typeof updateTaskResponse>;
export type GetTaskByIdRequest = InferInput<typeof getTaskByIdRequest>;
export type GetTaskByIdResponse = InferInput<typeof getTaskByIdResponse>;
