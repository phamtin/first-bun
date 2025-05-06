import type { ClientSession } from "mongodb";
import type { Job } from "bullmq";
import { ProjectColl, TaskColl } from "@/loaders/mongo";
import { toObjectIds, withTransaction } from "@/pkgs/mongodb/helper";
import type { AccountModel } from "../../../../database/model/account/account.model";
import { ProjectStatus } from "../../../../database/model/project/project.model";
import { AppError } from "@/utils/error";
import type { SyncModelQueueJob } from "../../type";

const syncCollectionAccounts = async (job: Job<SyncModelQueueJob>): Promise<boolean> => {
	const accountModel = job.data.payload.payload;
	const accountDb = toObjectIds(accountModel) as Omit<AccountModel, "accountSettings">;

	return withTransaction(async (session: ClientSession) => {
		// PROJECTS: UPDATE OWNER
		await ProjectColl.updateMany(
			{
				"participantInfo.owner._id": accountDb._id,

				"projectInfo.status": {
					$ne: ProjectStatus.Archived,
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
		await ProjectColl.updateMany(
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

export { syncCollectionAccounts, syncModelProcessor };
