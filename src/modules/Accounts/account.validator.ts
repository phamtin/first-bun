import { t, Static } from "elysia";

export const getMyTasksResponse = t.Array(
	t.Object({
		_id: t.String(),
		title: t.String(),
		description: t.String(),
		timing: t.String(),
		status: t.String(),
	}),
);

export const createTaskResponse = t.Object({
	taskId: t.String(),
});

export type GetMyTasksResponse = Static<typeof getMyTasksResponse>;
export type CreateTaskResponse = Static<typeof createTaskResponse>;
