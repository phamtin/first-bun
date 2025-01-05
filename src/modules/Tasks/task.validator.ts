import * as v from "valibot";
import type { InferInput } from "valibot";

import { TaskPriority, TaskStatus, vExtendTaskModel, vSubTask, vTaskModel } from "../../database/model/task/task.model";
import { stringObjectId, vAttributePattern } from "@/types/common.type";

export const createTaskRequest = v.strictObject({
	title: v.pipe(v.string(), v.minLength(2, "Title min 2 characters long")),
	description: v.optional(v.string()),
	status: v.optional(v.enum(TaskStatus)),
	assigneeId: v.optional(stringObjectId),
	projectId: stringObjectId,
	timing: v.strictObject({
		startDate: v.optional(v.string()),
		endDate: v.optional(v.string()),
		estimation: v.optional(v.string()),
	}),
	priority: v.optional(v.enum(TaskPriority)),
	additionalInfo: v.optional(v.array(vAttributePattern)),
	subTasks: v.optional(
		v.array(
			v.strictObject({
				title: v.string(),
				status: v.optional(v.enum(TaskStatus)),
				description: v.optional(v.string()),
				priority: v.optional(v.enum(TaskPriority)),
				additionalInfo: v.optional(v.array(vAttributePattern)),
			})
		)
	),
});

export const createTaskResponse = vTaskModel;

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
	tags: v.optional(v.pipe(v.array(stringObjectId), v.maxLength(9, "Too many tags"))),
});

export const getTasksResponse = v.array(vTaskModel);

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
export type GetMyTasksRequest = InferInput<typeof getMyTasksRequest>;
export type GetMyTasksResponse = InferInput<typeof getMyTasksResponse>;
export type UpdateTaskRequest = InferInput<typeof updateTaskRequest>;
export type UpdateTaskResponse = InferInput<typeof updateTaskResponse>;
export type GetTaskByIdRequest = InferInput<typeof getTaskByIdRequest>;
export type GetTaskByIdResponse = InferInput<typeof getTaskByIdResponse>;
export type GetTasksResponse = InferInput<typeof getTasksResponse>;
