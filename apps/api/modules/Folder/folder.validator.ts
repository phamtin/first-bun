import type { InferInput } from "valibot";
import * as v from "valibot";
import { FolderStatus, vExtendFolderModel, vFolderModel } from "@/shared/database/model/folder/folder.model";
import { TaskStatus } from "@/shared/database/model/task/task.model";
import { stringObjectId } from "@/shared/types/common.type";

export const getFoldersRequest = v.strictObject({
	ownerId: v.optional(stringObjectId),
	memberId: v.optional(stringObjectId),
	title: v.optional(v.string()),
	description: v.optional(v.string()),
	status: v.optional(v.enum(FolderStatus)),
});

export const getMyFoldersResponse = v.strictObject({
	folder: v.omit(vFolderModel, ["documents"]),
	taskStats: v.strictObject({
		Total: v.number(),
		[TaskStatus.NotStartYet]: v.number(),
		[TaskStatus.InProgress]: v.number(),
		[TaskStatus.Pending]: v.number(),
		[TaskStatus.Done]: v.number(),
	}),
});

export const createFolderRequest = v.strictObject({
	title: v.string(),
	color: v.string(),
	description: v.optional(v.string()),
	status: v.optional(v.enum(FolderStatus)),
});

export const createFolderResponse = v.strictObject({
	folder: vFolderModel,
	taskStats: v.pick(vExtendFolderModel, ["taskStats"]),
	timeStats: v.pick(vExtendFolderModel, ["timeStats"]),
});

export const updateFolderRequest = v.strictObject({
	title: v.optional(v.string()),
	description: v.optional(v.string()),
	status: v.optional(v.enum(FolderStatus)),
	color: v.optional(v.string()),
	tags: v.optional(v.array(v.strictObject({ _id: v.optional(stringObjectId), color: v.pipe(v.string(), v.trim()), name: v.pipe(v.string(), v.trim()) }))),
});

export const updateFolderResponse = v.strictObject({
	folder: vFolderModel,
	taskStats: v.pick(vExtendFolderModel, ["taskStats"]),
	timeStats: v.pick(vExtendFolderModel, ["timeStats"]),
});

export const getFolderDetailRequest = v.strictObject({
	folderId: stringObjectId,
});

export const getFolderDetailResponse = v.strictObject({
	folder: vFolderModel,
	taskStats: v.pick(vExtendFolderModel, ["taskStats"]),
	timeStats: v.pick(vExtendFolderModel, ["timeStats"]),
});

export const inviteRequest = v.strictObject({
	folderId: stringObjectId,
	emails: v.pipe(v.array(v.pipe(v.string(), v.email(), v.trim(), v.toLowerCase())), v.maxLength(64, "Too many invitations")),
});

export const inviteResponse = v.strictObject({
	success: v.boolean(),
});

export const responseInvitationRequest = v.strictObject({
	type: v.union([v.literal("accept"), v.literal("reject")]),
	folderId: stringObjectId,
	email: v.pipe(v.string(), v.email(), v.trim(), v.toLowerCase()),
});

export const responseInvitationResponse = v.strictObject({
	success: v.boolean(),
});

export const removeRequest = v.strictObject({
	folderId: stringObjectId,
	memberEmail: v.pipe(v.string(), v.email(), v.trim(), v.toLowerCase()),
});

export const removeResponse = v.strictObject({
	success: v.boolean(),
});

export const withdrawInvitationRequest = v.strictObject({
	folderId: stringObjectId,
	inviteeEmail: v.pipe(v.string(), v.email(), v.trim()),
});

export const withdrawInvitationResponse = v.strictObject({
	success: v.boolean(),
});

export type GetFoldersRequest = InferInput<typeof getFoldersRequest>;
export type GetMyFoldersResponse = InferInput<typeof getMyFoldersResponse>;
export type CreateFolderRequest = InferInput<typeof createFolderRequest>;
export type CreateFolderResponse = InferInput<typeof createFolderResponse>;
export type UpdateFolderRequest = InferInput<typeof updateFolderRequest>;
export type UpdateFolderResponse = InferInput<typeof updateFolderResponse>;
export type GetFolderDetailRequest = InferInput<typeof getFolderDetailRequest>;
export type GetFolderDetailResponse = InferInput<typeof getFolderDetailResponse>;
export type InviteRequest = InferInput<typeof inviteRequest>;
export type InviteResponse = InferInput<typeof inviteResponse>;
export type ResponseInvitationRequest = InferInput<typeof responseInvitationRequest>;
export type ResponseInvitationResponse = InferInput<typeof responseInvitationResponse>;
export type RemoveRequest = InferInput<typeof removeRequest>;
export type RemoveResponse = InferInput<typeof removeResponse>;
export type WithdrawInvitationRequest = InferInput<typeof withdrawInvitationRequest>;
export type WithdrawInvitationResponse = InferInput<typeof withdrawInvitationResponse>;
