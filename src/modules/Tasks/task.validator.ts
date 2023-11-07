import { t, Static } from "elysia";

import { taskModel, taskPriority, taskStatus, taskTiming } from "./task.model";
import { attributePattern } from "@/types/common.type";

export const createTaskRequest = t.Object({
	title: t.String(),
	status: taskStatus,
	timing: t.Optional(taskTiming),
	description: t.Optional(t.String()),
	additionalInfo: t.Optional(t.Array(attributePattern)),
});

export const createTaskResponse = taskModel;

export type CreateTaskRequest = Static<typeof createTaskRequest>;
export type CreateTaskResponse = Static<typeof createTaskResponse>;
