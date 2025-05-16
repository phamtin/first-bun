import type { ObjectId, WithoutId } from "mongodb";
import dayjs from "@/shared/utils/dayjs";
import { FolderColl } from "@/shared/loaders/mongo";
import type { GetMyFoldersResponse, GetFolderByIdResponse } from "./folder.validator";

import { FolderStatus, type ExtendFolderModel, type FolderModel } from "@/shared/database/model/folder/folder.model";
import { AppError } from "@/shared/utils/error";
import type { Context } from "hono";
import { toObjectId } from "@/shared/services/mongodb/helper";
import { toPayloadUpdate } from "@/shared/utils/transfrom";
import type { DeepPartial } from "@/shared/types/common.type";
import { TaskStatus } from "@/shared/database/model/task/task.model";
import type { AccountModel } from "@/shared/database/model/account/account.model";

const checkActiveFolder = async (ctx: Context, folderId: string): Promise<FolderModel | null> => {
	const p = await FolderColl.findOne({
		_id: toObjectId(folderId),

		"folderInfo.status": {
			$ne: FolderStatus.Archived,
		},
		deletedAt: {
			$exists: false,
		},
	});

	if (!p) return null;

	return p;
};

const getMyFolders = async (ctx: Context): Promise<GetMyFoldersResponse[]> => {
	const userId = toObjectId(ctx.get("user")._id);

	const res = (await FolderColl.find({
		$or: [
			{
				"participantInfo.owner._id": userId,
			},
			{
				"participantInfo.members": { $elemMatch: { _id: userId } },
			},
		],
		status: {
			$ne: FolderStatus.Archived,
		},
		deletedAt: {
			$exists: false,
		},
	}).toArray()) as FolderModel[];

	return res;
};

const getFolderById = async (ctx: Context, id: string): Promise<GetFolderByIdResponse> => {
	const res = (await FolderColl.aggregate([
		{
			$match: {
				_id: toObjectId(id),

				deletedAt: { $exists: false },
			},
		},
		{
			$lookup: {
				from: "tasks",
				let: { folderId: "$_id" },
				pipeline: [
					{
						$match: {
							$expr: {
								$and: [
									{
										$eq: ["$folderId", "$$folderId"],
									},
									{
										$ne: ["$status", TaskStatus.Archived],
									},
									{
										$not: [{ $ifNull: ["$deletedAt", false] }],
									},
								],
							},
						},
					},
					{
						$project: {
							"assigneeInfo._id": 1,
							title: 1,
							status: 1,
							priority: 1,
							folderId: 1,
							timing: 1,
							createdAt: 1,
						},
					},
				],
				as: "tasks",
			},
		},
		{
			$project: {
				"participantInfo.owner.accountSettings": 0,
				"participantInfo.members.accountSettings": 0,
			},
		},
	]).toArray()) as [FolderModel & ExtendFolderModel];

	if (res.length !== 1) {
		throw new AppError("INTERNAL_SERVER_ERROR", "Something went wrong");
	}

	return res[0];
};

const createFolder = async (ctx: Context, payload: WithoutId<FolderModel>): Promise<ObjectId> => {
	const data: WithoutId<FolderModel> = {
		...payload,
	};

	const { acknowledged, insertedId } = await FolderColl.insertOne(data);

	if (!acknowledged) throw new AppError("INTERNAL_SERVER_ERROR", "Fail to create folder");

	return insertedId;
};

const updateFolder = async (ctx: Context, folderId: string, payload: DeepPartial<FolderModel>): Promise<boolean> => {
	if (payload.folderInfo) {
		payload.folderInfo.isDefaultFolder = undefined;
	}

	payload.updatedAt = dayjs().toDate();

	const updated = await FolderColl.findOneAndUpdate(
		{
			_id: toObjectId(folderId),
		},
		{
			$set: toPayloadUpdate(payload),
		},
		{
			ignoreUndefined: true,
			returnDocument: "after",
		},
	);

	return !!updated?._id;
};

const deleteFolder = async (ctx: Context, folderId: string): Promise<boolean> => {
	const res = await FolderColl.findOneAndUpdate(
		{
			_id: toObjectId(folderId),
		},
		{
			$set: {
				deletedAt: dayjs().toDate(),
				deletedBy: toObjectId(ctx.get("user")._id),
			},
		},
		{
			returnDocument: "after",
		},
	);

	return !!res?.deletedAt;
};

const addMemberToFolder = async (ctx: Context, folderId: string, member: AccountModel): Promise<boolean> => {
	const updated = await FolderColl.updateOne(
		{
			_id: toObjectId(folderId),
		},
		{
			$push: {
				"participantInfo.members": member,
			},
			$pull: {
				"participantInfo.invitations": {
					email: member.profileInfo.email,
				},
			},
			$set: {
				updatedAt: dayjs().toDate(),
			},
		},
	);

	return updated.acknowledged;
};

const removeMember = async (ctx: Context, folderId: string, memberEmail: string): Promise<boolean> => {
	const updated = await FolderColl.updateOne(
		{
			_id: toObjectId(folderId),
		},
		{
			$pull: {
				"participantInfo.members": {
					"profileInfo.email": memberEmail,
				},
				"participantInfo.invitations": {
					email: memberEmail,
				},
			},
			$set: {
				updatedAt: dayjs().toDate(),
			},
		},
	);

	return updated.acknowledged;
};

const FolderRepo = {
	getMyFolders,
	createFolder,
	getFolderById,
	updateFolder,
	deleteFolder,
	checkActiveFolder,
	addMemberToFolder,
	removeMember,
};

export default FolderRepo;
