import type { Filter, ObjectId, WithoutId } from "mongodb";
import dayjs from "@/shared/utils/dayjs";
import { FolderColl } from "@/shared/loaders/mongo";
import type { GetFolderByIdResponse, GetFoldersRequest } from "./folder.validator";
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
				localField: "_id",
				foreignField: "folderId",
				pipeline: [
					{
						$match: {
							status: { $ne: TaskStatus.Archived },
							deletedAt: { $exists: false },
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
	getFolders,
	createFolder,
	getFolderById,
	updateFolder,
	deleteFolder,
	checkActiveFolder,
	addMemberToFolder,
	removeMember,
};

export default FolderRepo;
