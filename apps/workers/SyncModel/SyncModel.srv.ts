import type { ClientSession } from "mongodb";
import type { Job } from "bullmq";
import { FolderColl, TaskColl } from "@/shared/loaders/mongo";
import { toObjectIds, withTransaction } from "@/shared/services/mongodb/helper";
import { AppError } from "@/shared/utils/error";
import type { SyncModelQueueJob } from "@/shared/services/bullMQ/type";
import type { AccountModel } from "@/shared/database/model/account/account.model";
import { FolderStatus } from "@/shared/database/model/folder/folder.model";

const syncCollectionAccounts = async (job: Job<SyncModelQueueJob>): Promise<boolean> => {
	const accountModel = job.data.payload.payload;
	const accountDb = toObjectIds(accountModel) as Omit<AccountModel, "accountSettings">;

	return withTransaction(async (session: ClientSession) => {
		// PROJECTS: UPDATE OWNER
		await FolderColl.updateMany(
			{
				"participantInfo.owner._id": accountDb._id,

				"folderInfo.status": {
					$ne: FolderStatus.Archived,
				},
				deletedAt: {
					$exists: false,
				},
			},
			{
				$set: {
					"participantInfo.owner": accountDb,
				},
			},
			{ session },
		);

		// PROJECTS: UPDATE MEMBERS
		await FolderColl.updateMany(
			{
				"participantInfo.members._id": accountDb._id,
				deletedAt: { $exists: false },
			},
			{
				$set: {
					"participantInfo.members.$": accountDb,
				},
			},
			{ session },
		);

		// TASKS: UPDATE ASSIGNEE
		await TaskColl.updateMany(
			{
				"assigneeInfo._id": accountDb._id,
				deletedAt: { $exists: false },
			},
			{
				$set: {
					"assigneeInfo.$": accountDb,
				},
			},
			{ session },
		);

		return true;
	});
};

const syncModelProcessor = async (job: Job<SyncModelQueueJob>) => {
	console.log(`-------------------- START job ${job.id} --------------------`, job.data);

	const collection = job.data.payload.model;

	switch (collection) {
		case "accounts":
			await syncCollectionAccounts(job);
			break;

		default:
			throw new AppError("INTERNAL_SERVER_ERROR", "Unknown collection");
	}

	return { status: "success" };
};

export { syncModelProcessor };
