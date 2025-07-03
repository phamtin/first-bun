import type { FolderModel } from "@/shared/database/model/folder/folder.model";
import { TaskPriority, TaskStatus } from "@/shared/database/model/task/task.model";
import { FolderColl } from "@/shared/loaders/mongo";
import { toObjectId } from "@/shared/services/mongodb/helper";

export const checkUserIsParticipantFolder = async (userId: string, folderId: string): Promise<[boolean, FolderModel | null]> => {
	if (!userId || !folderId) {
		return [false, null];
	}

	const userObjectId = toObjectId(userId);

	const folder = await FolderColl.findOne({
		_id: toObjectId(folderId),

		deletedAt: {
			$exists: false,
		},

		$or: [
			{
				"participantInfo.owner._id": userObjectId,
			},
			{
				"participantInfo.members": { $elemMatch: { _id: userObjectId } },
			},
		],
	});

	if (!folder) return [false, null];

	return [true, folder];
};

const buildFolderStats = async (folderId: string) => {
	const folderIdObj = toObjectId(folderId);

	const r = await FolderColl.aggregate([
		{
			$match: { _id: folderIdObj },
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
							folderId: 1,
							priority: 1,
							status: 1,
						},
					},
					{
						$group: {
							_id: "$folderId",
							taskStatsTotal: { $sum: 1 },
							taskStatsNotStartYet: {
								$sum: { $cond: [{ $eq: ["$status", TaskStatus.NotStartYet] }, 1, 0] },
							},
							taskStatsInProgress: {
								$sum: { $cond: [{ $eq: ["$status", TaskStatus.InProgress] }, 1, 0] },
							},
							taskStatsPending: {
								$sum: { $cond: [{ $eq: ["$status", TaskStatus.Pending] }, 1, 0] },
							},
							taskStatsDone: {
								$sum: { $cond: [{ $eq: ["$status", TaskStatus.Done] }, 1, 0] },
							},
							taskStatsCritical: {
								$sum: { $cond: [{ $eq: ["$priority", TaskPriority.Critical] }, 1, 0] },
							},
							taskStatsHigh: {
								$sum: { $cond: [{ $eq: ["$priority", TaskPriority.High] }, 1, 0] },
							},
							taskStatsMedium: {
								$sum: { $cond: [{ $eq: ["$priority", TaskPriority.Medium] }, 1, 0] },
							},
							taskStatsLow: {
								$sum: { $cond: [{ $eq: ["$priority", TaskPriority.Low] }, 1, 0] },
							},

							timeStatsTotal: { $sum: 1 },
							timeStatsCriticalAll: { $sum: 1 },
							timeStatsHighAll: { $sum: 1 },
							timeStatsMediumAll: { $sum: 1 },
							timeStatsLowAll: { $sum: 1 },
						},
					},
					{
						$project: {
							_id: 0,
							taskStats: {
								Total: "$taskStatsTotal",
								[TaskStatus.NotStartYet]: "$taskStatsNotStartYet",
								[TaskStatus.InProgress]: "$taskStatsInProgress",
								[TaskStatus.Pending]: "$taskStatsPending",
								[TaskStatus.Done]: "$taskStatsDone",
								[TaskPriority.Critical]: "$taskStatsCritical",
								[TaskPriority.High]: "$taskStatsHigh",
								[TaskPriority.Medium]: "$taskStatsMedium",
								[TaskPriority.Low]: "$taskStatsLow",
							},
							timeStats: {
								Total: 100,
								[TaskPriority.Critical]: "$timeStatsCriticalAll",
								[TaskPriority.High]: "$timeStatsHighAll",
								[TaskPriority.Medium]: "$timeStatsMediumAll",
								[TaskPriority.Low]: "$timeStatsLowAll",
							},
						},
					},
				],
				as: "combinedStats",
			},
		},
		{
			$unwind: {
				path: "$combinedStats",
				preserveNullAndEmptyArrays: true,
			},
		},
		{
			$replaceRoot: {
				newRoot: { $ifNull: ["$combinedStats", {}] },
			},
		},
	]).toArray();

	if (!r.length) return null;

	return r[0];
};

const FolderUtil = {
	checkUserIsParticipantFolder,
	buildFolderStats,
};

export default FolderUtil;
