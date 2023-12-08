import { t, Static } from "elysia";
import { accountModel } from "./account.model";
import { taskPriority, taskStatus } from "../Tasks/task.model";

export const createTaskResponse = t.Object({
	taskId: t.String(),
});

export const getMyTasksRequest = t.Object({
	query: t.Optional(t.String()),
	status: t.Optional(t.Array(taskStatus)),
	priorities: t.Optional(t.Array(taskPriority)),
	startDate: t.Optional(t.String()),
	endDate: t.Optional(t.String()),
});

export const getMyTasksResponse = t.Array(
	t.Object({
		_id: t.String(),
		title: t.String(),
		description: t.String(),
		status: taskStatus,
	})
);

export const getMyProfileResponse = accountModel;

export type CreateTaskResponse = Static<typeof createTaskResponse>;
export type GetMyTasksResponse = Static<typeof getMyTasksResponse>;
export type GetMyProfileResponse = Static<typeof getMyProfileResponse>;
export type GetMyTasksRequest = Static<typeof getMyTasksRequest>;
