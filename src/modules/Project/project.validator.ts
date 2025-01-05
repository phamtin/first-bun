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

export const updateProjectRequest = v.strictObject({
	title: v.optional(v.string()),
	description: v.optional(v.string()),
	status: v.optional(v.enum(ProjectStatus)),
	color: v.optional(v.string()),
	memberIds: v.optional(v.array(v.string())),
	tags: v.optional(v.array(v.strictObject({ _id: v.optional(stringObjectId), color: v.pipe(v.string(), v.trim()), name: v.string() }))),
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

export type CreateProjectRequest = InferInput<typeof createProjectRequest>;
export type CreateProjectResponse = InferInput<typeof createProjectResponse>;
export type UpdateProjectRequest = InferInput<typeof updateProjectRequest>;
export type UpdateProjectResponse = InferInput<typeof updateProjectResponse>;
export type GetProjectByIdRequest = InferInput<typeof getProjectByIdRequest>;
export type GetProjectByIdResponse = InferInput<typeof getProjectByIdResponse>;
