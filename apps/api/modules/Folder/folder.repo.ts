import type { Filter, ObjectId, WithoutId } from "mongodb";
import type { AccountModel } from "@/shared/database/model/account/account.model";
import { type FolderModel, FolderStatus } from "@/shared/database/model/folder/folder.model";
import { FolderColl } from "@/shared/loaders/mongo";
import { toObjectId } from "@/shared/services/mongodb/helper";
import type { Context } from "@/shared/types/app.type";
import type { DeepPartial } from "@/shared/types/common.type";
import dayjs from "@/shared/utils/dayjs";
import { AppError } from "@/shared/utils/error";
import { toPayloadUpdate } from "@/shared/utils/transfrom";
import type { GetFoldersRequest } from "./folder.validator";

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

const getFolders = async (ctx: Context, request: GetFoldersRequest): Promise<FolderModel[]> => {
	const filter: Filter<FolderModel> = {
		"folderInfo.status": {
			$ne: FolderStatus.Archived,
		},
		deletedAt: {
			$exists: false,
		},
	};

	if (request.ownerId) {
		filter["participantInfo.owner._id"] = toObjectId(request.ownerId);
	}
	if (request.memberId) {
		filter["participantInfo.members"] = { $elemMatch: { _id: toObjectId(request.memberId) } };
	}
	if (request.status) {
		filter["folderInfo.status"] = request.status;
	}
	if (request.title) {
		filter["folderInfo.title"] = request.title;
	}
	if (request.description) {
		filter["folderInfo.description"] = request.description;
	}

	const res = await FolderColl.find(filter, {
		projection: {
			documents: 0,
			"participantInfo.owner.accountSettings": 0,
			"participantInfo.members.accountSettings": 0,
		},
	}).toArray();

	return res;
};

const getFolderById = async (ctx: Context, id: string): Promise<FolderModel | null> => {
	const res = await FolderColl.findOne(
		{
			_id: toObjectId(id),

			deletedAt: { $exists: false },
		},
		{
			projection: {
				"participantInfo.owner.accountSettings": 0,
				"participantInfo.members.accountSettings": 0,
			},
		},
	);

	if (!res) throw new AppError("NOT_FOUND", "Folder not found");

	return res;
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
				deletedBy: toObjectId(ctx.user._id),
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
					inviteeEmail: member.profileInfo.email,
				},
			},
			$set: {
				updatedAt: dayjs().toDate(),
			},
		},
		{ ignoreUndefined: true },
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
					inviteeEmail: memberEmail,
				},
			},
			$set: {
				updatedAt: dayjs().toDate(),
				updatedBy: toObjectId(ctx.user._id),
			},
		},
		{ ignoreUndefined: true },
	);

	return updated.acknowledged;
};

const withdrawInvitation = async (ctx: Context, folderId: string, inviteeEmail: string): Promise<boolean> => {
	const updated = await FolderColl.updateOne(
		{
			_id: toObjectId(folderId),
		},
		{
			$pull: {
				"participantInfo.invitations": {
					inviteeEmail,
				},
			},
			$set: {
				updatedAt: dayjs().toDate(),
				updatedBy: toObjectId(ctx.user._id),
			},
		},
		{ ignoreUndefined: true },
	);

	return updated.acknowledged;
};

const FolderRepo = {
	getFolders,
	createFolder,
	getFolderById,
	updateFolder,
	deleteFolder,
	checkActiveFolder,
	addMemberToFolder,
	removeMember,
	withdrawInvitation,
};

export default FolderRepo;
