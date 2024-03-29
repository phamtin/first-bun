import { t, Static } from "elysia";

import { taskModel, taskPriority, taskStatus } from "./task.model";
import { attributePattern } from "@/types/common.type";
import { taskTagModel } from "../Tags/tag.model";

export const createTaskRequest = t.Object({
	title: t.String(),
	description: t.Optional(t.String()),
	status: t.Optional(taskStatus),
	timing: t.Optional(
		t.Object({
			startDate: t.Optional(t.String()),
			endDate: t.Optional(t.String()),
			estimation: t.Optional(t.String()),
		})
	),
	tags: t.Optional(t.Array(taskTagModel)),
	priority: t.Optional(taskPriority),
	additionalInfo: t.Optional(t.Array(attributePattern)),
});

export const createTaskResponse = taskModel;

export const getTasksRequest = t.Object({
	query: t.Optional(t.String()),
	status: t.Optional(t.Array(taskStatus)),
	priorities: t.Optional(t.Array(taskPriority)),
	startDate: t.Optional(t.Array(t.String())),
	endDate: t.Optional(t.Array(t.String())),
});

export const getTasksResponse = taskModel;

export const updateTasksRequest = t.Object({
	title: t.Optional(t.String()),
	status: t.Optional(taskStatus),
	timing: t.Optional(
		t.Object({
			startDate: t.Optional(t.String()),
			endDate: t.Optional(t.String()),
			estimation: t.Optional(t.String()),
		})
	),
	tags: t.Optional(t.Array(taskTagModel)),
	priority: t.Optional(taskPriority),
	description: t.Optional(t.String()),
	additionalInfo: t.Optional(t.Array(attributePattern)),
});

export type CreateTaskRequest = Static<typeof createTaskRequest>;
export type CreateTaskResponse = Static<typeof createTaskResponse>;
export type GetTasksRequest = Static<typeof getTasksRequest>;
export type GetTasksResponse = Static<typeof getTasksResponse>;
export type UpdateTasksRequest = Static<typeof updateTasksRequest>;
