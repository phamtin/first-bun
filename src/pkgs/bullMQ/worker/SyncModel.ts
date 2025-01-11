import type { Job } from "bullmq";
import type { SyncModelJobData } from "../queue/SyncModel.queue";
import { client, ProjectColl, TaskColl } from "@/loaders/mongo";
import { toObjectIds } from "@/pkgs/mongodb/helper";
import type { AccountModel } from "../../../database/model/account/account.model";

const ModelToSyncWith = {
	Account: {
		Project: "projects",
		Task: "tasks",
	},
};

const syncCollectionAccounts = async (job: Job<SyncModelJobData>) => {
	const accountModel = job.data.payload;

	const { accountSettings, ...rest } = accountModel;

	const accountDb = toObjectIds(rest) as Omit<AccountModel, "accountSettings">;

	const session = client.startSession();

	try {
		session.startTransaction();

		/**
		 *  Projects
		 */
		await ProjectColl.updateMany(
			{
				"participantInfo.owner._id": accountDb._id,
				deletedAt: { $exists: false },
			},
			{
				$set: {
					"participantInfo.owner": accountDb,
				},
			},
			{ session }
		);
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
			{ session }
		);

		/**
		 *  Tasks
		 */
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
			{ session }
		);

		await session.commitTransaction();
	} catch (e) {
		console.log("[ERROR] syncCollectionAccounts: ", e);
		await session.abortTransaction();
		throw e;
	} finally {
		await session.endSession();
	}

	return true;
};

export { syncCollectionAccounts };
