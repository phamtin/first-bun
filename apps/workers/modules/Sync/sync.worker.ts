import { AppError } from "@/shared/utils/error";
import { TaskColl } from "@/shared/loaders/mongo";
import { toObjectIds, withTransaction } from "@/shared/services/mongodb/helper";
import type { AccountModel } from "@/shared/database/model/account/account.model";
import { FolderColl } from "@/shared/loaders/mongo";
import { FolderStatus } from "@/shared/database/model/folder/folder.model";
import type { ClientSession } from "mongodb";
import type { PublishMessage } from "@/api/init-nats";

type SyncModelAccountPayload = {
	model: string;
	payload: AccountModel;
};
const syncCollectionAccounts = async (payload: SyncModelAccountPayload): Promise<boolean> => {
	const accountModel = payload.payload;
	const accountDb = toObjectIds(accountModel) as Omit<AccountModel, "accountSettings">;

	console.log(JSON.parse(JSON.stringify(accountDb, null, 4)));

	// throw new Error("WTF")

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

const SyncWorker = async (msg: PublishMessage) => {
	switch (msg.data.model) {
		case "accounts":
			await syncCollectionAccounts(msg.data);
			break;

		default:
			throw new AppError("INTERNAL_SERVER_ERROR", "Unknown collections");
	}
};

export default SyncWorker;
