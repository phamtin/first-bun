import type { ObjectId } from "mongodb";
import * as v from "valibot";

import { objectId, vAttributePattern, type AttributePattern } from "../../../types/common.type";
import { vAccountProfile, type AccountModel } from "../account/account.model";
import { type InlineTaskModel, vInlineTaskModel, type TaskModel } from "../task/task.model";

export type ProjectDocument = {
	urls: AttributePattern[];
};

export enum ProjectStatus {
	Planning = "Planning",
	InProgress = "InProgress",
	Done = "Done",
	Archived = "Archived",
}

export type ProjectInfo = {
	title: string;
	color: string;
	status: ProjectStatus;
	isDefaultProject: boolean;
	description?: string;
};

export type ProjectInvitation = {
	email: string;
	avatar: string;
	title: string;
	description?: string;
	expiredAt: Date;
	createdAt: Date;
};

export type ProjectParticipant = {
	owner: Omit<AccountModel, "accountSettings">;
	members: Omit<AccountModel, "accountSettings">[];
	invitations: ProjectInvitation[];
};

/**
 *  -----------------------------
 *	|
 * 	| Mongo Model - Project
 *	|
 * 	-----------------------------
 */

export type ProjectModel = {
	_id: ObjectId;

	projectInfo: ProjectInfo;
	participantInfo: ProjectParticipant;
	documents: ProjectDocument;
	tags?: { _id: ObjectId; color: string; name: string }[];

	createdAt: Date;
	createdBy?: ObjectId;
	updatedAt?: Date;
	deletedAt?: Date;
	deletedBy?: ObjectId;
};

export type ExtendProjectModel = {
	tasks: InlineTaskModel[];
};

/**
 *  -----------------------------
 *	|
 * 	| Validation Schema
 *	|
 * 	-----------------------------
 */

export const vProjectInvitation = v.strictObject({
	title: v.string(),
	description: v.optional(v.string()),
	email: v.pipe(v.string(), v.email(), v.trim(), v.toLowerCase()),
	avatar: v.string(),
	expiredAt: v.date(),
	createdAt: v.date(),
}) satisfies v.BaseSchema<ProjectInvitation, ProjectInvitation, v.BaseIssue<unknown>>;

export const vProjectInfo = v.strictObject({
	title: v.string(),
	color: v.string(),
	status: v.enum(ProjectStatus),
	isDefaultProject: v.boolean(),
	description: v.optional(v.string()),
}) satisfies v.BaseSchema<ProjectInfo, ProjectInfo, v.BaseIssue<unknown>>;

export const vProjectParticipant = v.strictObject({
	owner: v.omit(vAccountProfile, ["accountSettings"]),
	members: v.array(v.omit(vAccountProfile, ["accountSettings"])),
	invitations: v.array(vProjectInvitation),
}) satisfies v.BaseSchema<ProjectParticipant, ProjectParticipant, v.BaseIssue<unknown>>;

export const vProjectDocument = v.strictObject({
	urls: v.array(vAttributePattern),
}) satisfies v.BaseSchema<ProjectDocument, ProjectDocument, v.BaseIssue<unknown>>;

export const vProjectModel = v.strictObject({
	_id: objectId,

	projectInfo: vProjectInfo,
	participantInfo: vProjectParticipant,
	documents: vProjectDocument,
	tags: v.optional(v.array(v.strictObject({ _id: objectId, color: v.string(), name: v.string() }))),

	createdAt: v.date(),
	createdBy: v.optional(objectId),
	updatedAt: v.optional(v.date()),
	deletedAt: v.optional(v.date()),
	deletedBy: v.optional(objectId),
}) satisfies v.BaseSchema<ProjectModel, ProjectModel, v.BaseIssue<unknown>>;

export const vExtendProjectModel = v.strictObject({
	tasks: v.array(vInlineTaskModel),
}) satisfies v.BaseSchema<ExtendProjectModel, ExtendProjectModel, v.BaseIssue<unknown>>;
