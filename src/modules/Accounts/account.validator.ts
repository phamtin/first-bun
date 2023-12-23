import { t, Static } from "elysia";
import { accountModel, colorTheme } from "./account.model";
import { taskPriority, taskStatus } from "../Tasks/task.model";

export const getMyTasksRequest = t.Object({
	query: t.Optional(t.String()),
	status: t.Optional(t.Array(taskStatus)),
	priorities: t.Optional(t.Array(taskPriority)),
	startDate: t.Optional(t.Array(t.String())),
	endDate: t.Optional(t.String()),
});

export const getMyProfileResponse = accountModel;

export const getMyTasksResponse = t.Array(
	t.Object({
		_id: t.String(),
		title: t.String(),
		description: t.String(),
		status: taskStatus,
		priorities: t.Optional(taskPriority),
	})
);
export const updateProfileRequest = t.Object({
	fullname: t.Optional(t.String()),
	firstname: t.Optional(t.String()),
	lastname: t.Optional(t.String()),
	avatar: t.Optional(t.String()),
	profileInfo: t.Optional(
		t.Object({
			phoneNumber: t.Optional(t.Array(t.String())),
			birthday: t.Optional(t.String()),
		})
	),
	accountSetting: t.Optional(
		t.Object({
			theme: t.Optional(colorTheme),
			isPrivateAccount: t.Optional(t.Boolean()),
		})
	),
});

export type GetMyTasksResponse = Static<typeof getMyTasksResponse>;
export type GetMyProfileResponse = Static<typeof getMyProfileResponse>;
export type GetMyTasksRequest = Static<typeof getMyTasksRequest>;
export type UpdateProfileRequest = Static<typeof updateProfileRequest>;
