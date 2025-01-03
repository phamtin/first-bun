import * as v from "valibot";
import type { InferInput } from "valibot";

import { type ExtendTaskModel, TaskPriority, TaskStatus, vSubTask, vTaskModel } from "../../database/model/task/task.model";
import { stringObjectId, vAttributePattern } from "@/types/common.type";

const vExtendTaskModel = v.strictObject({
	hasAttachment: v.optional(v.boolean()),
}) satisfies v.BaseSchema<ExtendTaskModel, ExtendTaskModel, v.BaseIssue<unknown>>;

export const createTaskRequest = v.strictObject({
	title: v.string(),
	description: v.optional(v.string()),
	status: v.optional(v.enum(TaskStatus)),
	assigneeId: v.optional(stringObjectId),
	timing: v.strictObject({
		startDate: v.optional(v.string()),
		endDate: v.optional(v.string()),
		estimation: v.optional(v.string()),
	}),
	priority: v.optional(v.enum(TaskPriority)),
	additionalInfo: v.optional(v.array(vAttributePattern)),
	subTasks: v.optional(v.array(vSubTask)),
});

export const createTaskResponse = vTaskModel;

export const getTasksRequest = v.strictObject({
	query: v.optional(v.string()),
	assigneeId: v.optional(stringObjectId),
	status: v.optional(v.array(v.enum(TaskStatus))),
	priorities: v.optional(v.array(v.enum(TaskPriority))),
	startDate: v.optional(v.array(v.string())),
	endDate: v.optional(v.array(v.string())),
});

export const getMyTasksRequest = v.strictObject({
	query: v.optional(v.string()),
	status: v.optional(v.array(v.enum(TaskStatus))),
	priorities: v.optional(v.array(v.enum(TaskPriority))),
	startDate: v.optional(v.array(v.string())),
	endDate: v.optional(v.array(v.string())),
});

export const getMyTasksResponse = v.array(vTaskModel);

export const updateTaskRequest = v.strictObject({
	title: v.optional(v.string()),
	description: v.optional(v.string()),
	status: v.optional(v.enum(TaskStatus)),
	assigneeId: v.optional(stringObjectId),
	priority: v.optional(v.enum(TaskPriority)),
	timing: v.optional(
		v.strictObject({
			startDate: v.optional(v.string()),
			endDate: v.optional(v.string()),
			estimation: v.optional(v.string()),
		})
	),
	additionalInfo: v.optional(v.array(vAttributePattern)),
	subTasks: v.optional(v.array(vSubTask)),
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
export type GetMyTasksRequest = InferInput<typeof getMyTasksRequest>;
export type GetMyTasksResponse = InferInput<typeof getMyTasksResponse>;
export type UpdateTaskRequest = InferInput<typeof updateTaskRequest>;
export type UpdateTaskResponse = InferInput<typeof updateTaskResponse>;
export type GetTaskByIdRequest = InferInput<typeof getTaskByIdRequest>;
export type GetTaskByIdResponse = InferInput<typeof getTaskByIdResponse>;
