import type { ObjectId } from "mongodb";
import * as v from "valibot";

import { type AttributePattern, objectId, vAttributePattern } from "../../../types/common.type";
import { type AccountModel, vAccountProfile } from "../account/account.model";
import { TaskPriority, TaskStatus } from "../task/task.model";

export type FolderDocument = {
	urls: AttributePattern[];
};

export enum FolderStatus {
	Planning = "Planning",
	InProgress = "InProgress",
	Done = "Done",
	Archived = "Archived",
}

export type FolderInfo = {
	title: string;
	color: string;
	status: FolderStatus;
	isDefaultFolder: boolean;
	description?: string;
};

export type FolderInvitation = {
	title: string;
	inviteeEmail: string;
	inviteeAvatar: string;
	inviteeUsername: string;
	description?: string;
	expiredAt: Date;
	createdAt: Date;
};

export type FolderParticipant = {
	owner: Omit<AccountModel, "accountSettings">;
	members: Omit<AccountModel, "accountSettings">[];
	invitations: FolderInvitation[];
};

/**
 *  -----------------------------
 *	|
 * 	| Mongo Model - Folder
 *	|
 * 	-----------------------------
 */

export type FolderModel = {
	_id: ObjectId;

	folderInfo: FolderInfo;
	participantInfo: FolderParticipant;
	documents: FolderDocument;
	tags?: { _id: ObjectId; color: string; name: string }[];

	createdAt: Date;
	createdBy?: ObjectId;
	updatedAt?: Date;
	deletedAt?: Date;
	deletedBy?: ObjectId;
};

export type ExtendFolderModel = {
	taskStats: {
		Total: number;
		[TaskStatus.NotStartYet]: number;
		[TaskStatus.InProgress]: number;
		[TaskStatus.Pending]: number;
		[TaskStatus.Done]: number;
		[TaskPriority.Critical]: number;
		[TaskPriority.High]: number;
		[TaskPriority.Medium]: number;
		[TaskPriority.Low]: number;
	};
	timeStats: {
		Total: number;
		[TaskStatus.NotStartYet]: number;
		[TaskStatus.InProgress]: number;
		[TaskStatus.Pending]: number;
		[TaskStatus.Done]: number;
	};
};

/**
 *  -----------------------------
 *	|
 * 	| Validation Schema
 *	|
 * 	-----------------------------
 */

export const vFolderInvitation = v.strictObject({
	title: v.string(),
	description: v.optional(v.string()),
	inviteeEmail: v.pipe(v.string(), v.email(), v.trim(), v.toLowerCase()),
	inviteeAvatar: v.string(),
	inviteeUsername: v.string(),
	expiredAt: v.date(),
	createdAt: v.date(),
}) satisfies v.BaseSchema<FolderInvitation, FolderInvitation, v.BaseIssue<unknown>>;

export const vFolderInfo = v.strictObject({
	title: v.string(),
	color: v.string(),
	status: v.enum(FolderStatus),
	isDefaultFolder: v.boolean(),
	description: v.optional(v.string()),
}) satisfies v.BaseSchema<FolderInfo, FolderInfo, v.BaseIssue<unknown>>;

export const vFolderParticipant = v.strictObject({
	owner: v.omit(vAccountProfile, ["accountSettings"]),
	members: v.array(v.omit(vAccountProfile, ["accountSettings"])),
	invitations: v.array(vFolderInvitation),
}) satisfies v.BaseSchema<FolderParticipant, FolderParticipant, v.BaseIssue<unknown>>;

export const vFolderDocument = v.strictObject({
	urls: v.array(vAttributePattern),
}) satisfies v.BaseSchema<FolderDocument, FolderDocument, v.BaseIssue<unknown>>;

export const vFolderModel = v.strictObject({
	_id: objectId,

	folderInfo: vFolderInfo,
	participantInfo: vFolderParticipant,
	documents: vFolderDocument,
	tags: v.optional(v.array(v.strictObject({ _id: objectId, color: v.string(), name: v.string() }))),

	createdAt: v.date(),
	createdBy: v.optional(objectId),
	updatedAt: v.optional(v.date()),
	deletedAt: v.optional(v.date()),
	deletedBy: v.optional(objectId),
}) satisfies v.BaseSchema<FolderModel, FolderModel, v.BaseIssue<unknown>>;

export const vExtendFolderModel = v.strictObject({
	taskStats: v.strictObject({
		Total: v.number(),
		[TaskStatus.NotStartYet]: v.number(),
		[TaskStatus.InProgress]: v.number(),
		[TaskStatus.Pending]: v.number(),
		[TaskStatus.Done]: v.number(),
		[TaskPriority.Critical]: v.number(),
		[TaskPriority.High]: v.number(),
		[TaskPriority.Medium]: v.number(),
		[TaskPriority.Low]: v.number(),
	}),
	timeStats: v.strictObject({
		Total: v.number(),
		[TaskStatus.NotStartYet]: v.number(),
		[TaskStatus.InProgress]: v.number(),
		[TaskStatus.Pending]: v.number(),
		[TaskStatus.Done]: v.number(),
	}),
}) satisfies v.BaseSchema<ExtendFolderModel, ExtendFolderModel, v.BaseIssue<unknown>>;
