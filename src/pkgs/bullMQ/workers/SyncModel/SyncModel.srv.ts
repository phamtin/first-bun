import type { ClientSession } from "mongodb";
import type { Job } from "bullmq";
import type { SyncModelJobData } from "../../queue/SyncModel.queue";
import { ProjectColl, TaskColl } from "@/loaders/mongo";
import { toObjectIds, withTransaction } from "@/pkgs/mongodb/helper";
import type { AccountModel } from "../../../../database/model/account/account.model";
import { ProjectStatus } from "../../../../database/model/project/project.model";

const ModelToSyncWith = {
	Account: {
		Project: "projects",
		Task: "tasks",
	},
};

const syncCollectionAccounts = async (job: Job<SyncModelJobData>): Promise<boolean> => {
	const accountModel = job.data.payload;
	const { accountSettings, ...rest } = accountModel;
	const accountDb = toObjectIds(rest) as Omit<AccountModel, "accountSettings">;

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

export { syncCollectionAccounts };
