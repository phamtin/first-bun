import type { WithoutId } from "mongodb";
import { APINatsPublisher } from "@/api/init-nats";
import { type FolderInvitation, type FolderModel, FolderStatus } from "@/shared/database/model/folder/folder.model";
import { InviteJoinFolderPayloadStatus, NotificationType } from "@/shared/database/model/notification/notification.model";
import { TaskStatus } from "@/shared/database/model/task/task.model";
import { FolderColl } from "@/shared/loaders/mongo";
import { NatsEvent } from "@/shared/nats/types/events";
import { toObjectId } from "@/shared/services/mongodb/helper";
import type { Context } from "@/shared/types/app.type";
import dayjs from "@/shared/utils/dayjs";
import { AppError } from "@/shared/utils/error";
import { ErrorKey } from "@/shared/utils/error-key";
import AccountSrv from "../Accounts";
import NotificationSrv from "../Notification";
import TaskSrv from "../Tasks/task.srv";
import { DEFAULT_INVITATION_TITLE, PROJECT_INVITATION_EXPIRED_MINUTE } from "./folder.const";
import { buildPayloadUpdate } from "./folder.mapper";
import FolderRepo from "./folder.repo";
import FolderUtil from "./folder.util";
import type * as pv from "./folder.validator";

const getFolderById = async (ctx: Context, id: string): Promise<FolderModel | null> => {
	return FolderRepo.getFolderById(ctx, id);
};

const getMyFolders = async (ctx: Context): Promise<pv.GetMyFoldersResponse[]> => {
	const userId = toObjectId(ctx.user._id);
	const result = (await FolderColl.aggregate([
		{
			$match: {
				$or: [
					{
						"participantInfo.owner._id": userId,
					},
					{
						"participantInfo.members._id": userId,
					},
				],
				status: {
					$ne: FolderStatus.Archived,
				},
				deletedAt: {
					$exists: false,
				},
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
							_id: 1,
							status: 1,
							folderId: 1,
						},
					},
					{
						$group: {
							_id: "$folderId",
							Total: { $sum: 1 },
							[TaskStatus.NotStartYet]: {
								$sum: {
									$cond: [{ $eq: ["$status", TaskStatus.NotStartYet] }, 1, 0],
								},
							},
							[TaskStatus.InProgress]: {
								$sum: {
									$cond: [{ $eq: ["$status", TaskStatus.InProgress] }, 1, 0],
								},
							},
							[TaskStatus.Pending]: {
								$sum: {
									$cond: [{ $eq: ["$status", TaskStatus.Pending] }, 1, 0],
								},
							},
							[TaskStatus.Done]: {
								$sum: { $cond: [{ $eq: ["$status", TaskStatus.Done] }, 1, 0] },
							},
						},
					},
				],
				as: "taskStats",
			},
		},
		{
			$addFields: {
				taskStats: { $arrayElemAt: ["$taskStats", 0] },
			},
		},
		{
			$sort: {
				createdAt: -1,
			},
		},
		{
			$project: {
				folder: "$$ROOT",
				taskStats: 1,
			},
		},
		{
			$project: {
				_id: 0,
				"taskStats._id": 0,
				"folder.documents": 0,
				"folder.taskStats": 0,
				"folder.participantInfo.owner.accountSettings": 0,
				"folder.participantInfo.members.accountSettings": 0,
			},
		},
	]).toArray()) as pv.GetMyFoldersResponse[];

	return result;
};

const getFoldersCreatedByMe = async (ctx: Context, request: pv.GetFoldersRequest): Promise<FolderModel[]> => {
	return await FolderRepo.getFolders(ctx, { ownerId: ctx.user._id });
};

const getFoldersSharedWithMe = async (ctx: Context, request: pv.GetFoldersRequest): Promise<FolderModel[]> => {
	return await FolderRepo.getFolders(ctx, { memberId: ctx.user._id });
};

const checkActiveFolder = async (ctx: Context, folderId: string): Promise<FolderModel | null> => {
	return FolderRepo.checkActiveFolder(ctx, folderId);
};

const getFolderDetail = async (ctx: Context, id: string): Promise<pv.GetFolderDetailResponse> => {
	const [[canUserAccess, folder], folderStats] = await Promise.all([
		FolderUtil.checkUserIsParticipantFolder(ctx.user._id, id),
		FolderUtil.buildFolderStats(id),
	]);

	if (!canUserAccess) throw new AppError("NOT_FOUND", "You're not participant of folder");

	if (!folder || !folderStats || folder.folderInfo.status === FolderStatus.Archived) {
		throw new AppError("NOT_FOUND", "Folder not found");
	}

	return {
		folder,
		taskStats: folderStats.taskStats,
		timeStats: folderStats.timeStats,
	};
};

const createFolder = async (ctx: Context, request: pv.CreateFolderRequest, isDefaultFolder?: boolean): Promise<pv.CreateFolderResponse> => {
	const ownerId = toObjectId(ctx.user._id);

	if (isDefaultFolder) {
		const folder = await FolderColl.findOne({
			"participantInfo.owner._id": ownerId,
			"folderInfo.isDefaultFolder": true,
			deletedAt: { $exists: false },
		});

		if (folder) throw new AppError("BAD_REQUEST", "Hack CC");
	}
	const ownerModel = await AccountSrv.findAccountProfile(ctx, { accountId: ctx.user._id });

	if (!ownerModel) throw new AppError("NOT_FOUND", "Folder Owner not found");

	const { accountSettings, ..._ownerModel } = ownerModel;

	const payload: WithoutId<FolderModel> = {
		folderInfo: {
			title: request.title,
			color: request.color,
			description: request.description ?? undefined,
			isDefaultFolder: isDefaultFolder ?? false,
			status: request.status ?? FolderStatus.Planning,
		},
		participantInfo: {
			owner: _ownerModel,
			members: [],
			invitations: [],
		},
		documents: {
			urls: [],
		},
		createdAt: dayjs().toDate(),
		createdBy: ownerId,
	};

	const insertedId = await FolderRepo.createFolder(ctx, payload);

	return getFolderDetail(ctx, insertedId.toHexString());
};

const updateFolder = async (ctx: Context, folderId: string, request: pv.UpdateFolderRequest): Promise<pv.UpdateFolderResponse> => {
	const _folder = await FolderRepo.checkActiveFolder(ctx, folderId);

	if (!_folder) throw new AppError("NOT_FOUND", "Folder not found");

	const payload = buildPayloadUpdate(request, _folder);

	if (!payload) throw new AppError("BAD_REQUEST", "Invalid payload");

	const isSuccess = await FolderRepo.updateFolder(ctx, folderId, payload);

	if (!isSuccess) {
		throw new AppError("INTERNAL_SERVER_ERROR");
	}

	return getFolderDetail(ctx, folderId);
};

const deleteFolder = async (ctx: Context, folderId: string): Promise<boolean> => {
	const folder = await checkActiveFolder(ctx, folderId);

	if (!folder) throw new AppError("NOT_FOUND", "Folder not found");

	if (folder.participantInfo.owner._id.toHexString() !== ctx.user._id) {
		throw new AppError("BAD_REQUEST", "Can't delete folder");
	}
	const deletetaskPromisors: Promise<boolean>[] = [];

	const tasks = await TaskSrv.findTasksByFolderIds(ctx, [folderId]);

	for (const task of tasks) {
		deletetaskPromisors.push(TaskSrv.deleteTask(ctx, task._id.toHexString()));
	}

	try {
		await Promise.all(deletetaskPromisors);
	} catch (error) {
		throw new AppError("INTERNAL_SERVER_ERROR");
	}

	const isDeleted = await FolderRepo.deleteFolder(ctx, folderId);

	if (!isDeleted) throw new AppError("INTERNAL_SERVER_ERROR");

	return true;
};

const invite = async (ctx: Context, request: pv.InviteRequest): Promise<pv.InviteResponse> => {
	const folder = await checkActiveFolder(ctx, request.folderId);

	if (!folder) throw new AppError("NOT_FOUND", "Folder not found");

	if (!folder.participantInfo.owner._id.equals(ctx.user._id)) {
		throw new AppError("BAD_REQUEST", "Only owner can invite");
	}

	//	VALIDATE INVITEE's EMAIL
	const validEmails: string[] = [];
	const { participantInfo } = folder;

	for (const requestEmail of request.emails) {
		if (
			participantInfo.owner.profileInfo.email !== requestEmail &&
			participantInfo.members.map((mem) => mem.profileInfo.email).indexOf(requestEmail) === -1
		) {
			validEmails.push(requestEmail);
		}
	}
	if (validEmails.length === 0) {
		throw new AppError("BAD_REQUEST", "Already be member");
	}
	const invitees = await Promise.all(validEmails.map((email) => AccountSrv.findAccountProfile(ctx, { email })));

	const _dayjs = dayjs();
	const now = _dayjs.toDate();
	const expiredAt = _dayjs.add(PROJECT_INVITATION_EXPIRED_MINUTE, "minute").toDate();
	const invitations: FolderInvitation[] = [];

	for (const invitee of invitees) {
		if (!invitee) continue;
		invitations.push({
			title: DEFAULT_INVITATION_TITLE,
			inviteeEmail: invitee.profileInfo.email,
			inviteeAvatar: invitee.profileInfo.avatar,
			inviteeUsername: invitee.profileInfo.username,
			createdAt: now,
			expiredAt,
		});
	}

	const r = await FolderColl.updateOne(
		{
			_id: toObjectId(request.folderId),
		},
		{
			$push: {
				"participantInfo.invitations": { $each: invitations },
			},
			$set: { updatedAt: now },
		},
	);

	await APINatsPublisher.publish<(typeof NatsEvent)["Folders"]["Invited"]>(NatsEvent.Folders.Invited, { ctx, folder, request });

	return { success: r.acknowledged };
};

const responseInvitation = async (ctx: Context, request: pv.ResponseInvitationRequest): Promise<pv.ResponseInvitationResponse> => {
	const folder = await checkActiveFolder(ctx, request.folderId);

	if (!folder) throw new AppError("NOT_FOUND", "Folder not found");

	if (request.type === "reject") {
		return rejectInvitation(ctx, folder, request.email);
	}

	if (request.type === "accept") {
		return acceptInvitation(ctx, folder, request.email);
	}

	return { success: false };
};

const acceptInvitation = async (ctx: Context, folder: FolderModel, email: string): Promise<pv.ResponseInvitationResponse> => {
	const invitation = folder.participantInfo.invitations.find((invitation) => {
		return invitation.inviteeEmail === email && dayjs().isBefore(invitation.expiredAt);
	});

	if (!invitation) throw new AppError("BAD_REQUEST", "Invitation link has expired", ErrorKey.FolderInvitationExpired);

	const invitee = await AccountSrv.findAccountProfile(ctx, { email });

	if (!invitee) throw new AppError("NOT_FOUND", "Invitee not found");

	const success = await FolderRepo.addMemberToFolder(ctx, folder._id.toHexString(), invitee);

	//	UPDATE NOTIFICATION
	NotificationSrv.updateNotifications(ctx, {
		filter: {
			type: NotificationType.InviteJoinFolder,
			"payload.inviteeEmail": email,
			"payload.folderId": folder._id.toHexString(),
			"payload.status": InviteJoinFolderPayloadStatus.Active,
		},
		payload: {
			read: true,
			payload: {
				status: InviteJoinFolderPayloadStatus.Accepted,
			},
		},
	});

	return { success };
};

const rejectInvitation = async (ctx: Context, folder: FolderModel, email: string): Promise<pv.ResponseInvitationResponse> => {
	//	REMOVE INVITATION from PROJECT
	const r = await FolderColl.updateOne(
		{
			_id: folder._id,
		},
		{
			$pull: {
				"participantInfo.invitations": { inviteeEmail: email },
			},
			$set: {
				updatedAt: dayjs().toDate(),
			},
		},
	);

	//	UPDATE NOTIFICATION
	NotificationSrv.updateNotifications(ctx, {
		filter: {
			type: NotificationType.InviteJoinFolder,
			"payload.inviteeEmail": email,
			"payload.folderId": folder._id.toHexString(),
			"payload.status": InviteJoinFolderPayloadStatus.Active,
		},
		payload: {
			read: true,
			payload: {
				status: InviteJoinFolderPayloadStatus.Declined,
			},
		},
	});

	return { success: r.acknowledged };
};

const removeMember = async (ctx: Context, request: pv.RemoveRequest): Promise<pv.RemoveResponse> => {
	const folder = await checkActiveFolder(ctx, request.folderId);

	if (!folder) throw new AppError("NOT_FOUND", "Folder not found");

	if (!folder.participantInfo.owner._id.equals(ctx.user._id)) {
		throw new AppError("BAD_REQUEST", "Only owner can invite");
	}

	const isSuccess = await FolderRepo.removeMember(ctx, request.folderId, request.memberEmail);

	if (!isSuccess) {
		throw new AppError("INTERNAL_SERVER_ERROR");
	}

	return { success: true };
};

const withdrawInvitation = async (ctx: Context, request: pv.WithdrawInvitationRequest): Promise<pv.WithdrawInvitationResponse> => {
	const folder = await checkActiveFolder(ctx, request.folderId);

	if (!folder) throw new AppError("NOT_FOUND", "Folder not found");

	if (!folder.participantInfo.owner._id.equals(ctx.user._id)) {
		throw new AppError("BAD_REQUEST", "Only owner can withdraw invitation");
	}

	const invitation = folder.participantInfo.invitations.find((invitation) => invitation.inviteeEmail === request.inviteeEmail);

	if (!invitation) throw new AppError("NOT_FOUND", "Invitation not found");

	const isSuccess = await FolderRepo.withdrawInvitation(ctx, request.folderId, request.inviteeEmail);

	if (!isSuccess) throw new AppError("INTERNAL_SERVER_ERROR");

	await APINatsPublisher.publish<(typeof NatsEvent)["Folders"]["WithdrawInvitation"]>(NatsEvent.Folders.WithdrawInvitation, { ctx, folder, request });

	return { success: true };
};

const FolderSrv = {
	getFolderById,
	getMyFolders,
	getFoldersSharedWithMe,
	getFoldersCreatedByMe,
	updateFolder,
	createFolder,
	getFolderDetail,
	deleteFolder,
	checkActiveFolder,
	invite,
	responseInvitation,
	removeMember,
	withdrawInvitation,
};

export default FolderSrv;
