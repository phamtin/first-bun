import * as v from "valibot";
import type { InferInput } from "valibot";
import { stringObjectId } from "@/types/common.type";

import { ProjectStatus, vExtendProjectModel, vProjectModel } from "../../database/model/project/project.model";

export const createProjectRequest = v.strictObject({
	title: v.string(),
	color: v.string(),
	description: v.optional(v.string()),
	status: v.optional(v.enum(ProjectStatus)),
});

export const createProjectResponse = v.strictObject({
	...vProjectModel.entries,
	...vExtendProjectModel.entries,
});

export const getMyProjectsResponse = v.omit(vProjectModel, ["documents"]);

export const updateProjectRequest = v.strictObject({
	title: v.optional(v.string()),
	description: v.optional(v.string()),
	status: v.optional(v.enum(ProjectStatus)),
	color: v.optional(v.string()),
	tags: v.optional(
		v.array(
			v.strictObject({
				_id: v.optional(stringObjectId),
				color: v.pipe(v.string(), v.trim()),
				name: v.pipe(v.string(), v.trim()),
			})
		)
	),
});

export const updateProjectResponse = v.strictObject({
	...vProjectModel.entries,
	...vExtendProjectModel.entries,
});

export const getProjectByIdRequest = v.strictObject({
	projectId: stringObjectId,
});

export const getProjectByIdResponse = v.strictObject({
	...vProjectModel.entries,
	...vExtendProjectModel.entries,
});

export const inviteRequest = v.strictObject({
	projectId: stringObjectId,
	emails: v.array(v.pipe(v.string(), v.email(), v.trim(), v.toLowerCase())),
});

export const inviteResponse = v.strictObject({
	success: v.boolean(),
});

export const responseInvitationRequest = v.strictObject({
	type: v.union([v.literal("accept"), v.literal("reject")]),
	projectId: stringObjectId,
	email: v.pipe(v.string(), v.email(), v.trim(), v.toLowerCase()),
});

export const responseInvitationResponse = v.strictObject({
	success: v.boolean(),
});

export const removeRequest = v.strictObject({
	projectId: stringObjectId,
	memberEmail: v.pipe(v.string(), v.email(), v.trim(), v.toLowerCase()),
});

export const removeResponse = v.strictObject({
	success: v.boolean(),
});

export type GetMyProjectsResponse = InferInput<typeof getMyProjectsResponse>;
export type CreateProjectRequest = InferInput<typeof createProjectRequest>;
export type CreateProjectResponse = InferInput<typeof createProjectResponse>;
export type UpdateProjectRequest = InferInput<typeof updateProjectRequest>;
export type UpdateProjectResponse = InferInput<typeof updateProjectResponse>;
export type GetProjectByIdRequest = InferInput<typeof getProjectByIdRequest>;
export type GetProjectByIdResponse = InferInput<typeof getProjectByIdResponse>;
export type InviteRequest = InferInput<typeof inviteRequest>;
export type InviteResponse = InferInput<typeof inviteResponse>;
export type ResponseInvitationRequest = InferInput<typeof responseInvitationRequest>;
export type ResponseInvitationResponse = InferInput<typeof responseInvitationResponse>;
export type RemoveRequest = InferInput<typeof removeRequest>;
export type RemoveResponse = InferInput<typeof removeResponse>;
