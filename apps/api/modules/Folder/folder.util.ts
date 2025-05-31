import { FolderColl } from "@/shared/loaders/mongo";
import { toObjectId } from "@/shared/services/mongodb/helper";
import type { FolderModel } from "@/shared/database/model/folder/folder.model";
import { FolderStatus } from "@/shared/database/model/folder/folder.model";

export const checkUserIsParticipantFolder = async (userId: string, folderId: string): Promise<[boolean, FolderModel | null]> => {
	if (!userId || !folderId) {
		return [false, null];
	}

	const userObjectId = toObjectId(userId);

	const folder = await FolderColl.findOne({
		_id: toObjectId(folderId),

		"folderInfo.status": {
			$ne: FolderStatus.Archived,
		},

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

const FolderUtil = {
	checkUserIsParticipantFolder,
};

export default FolderUtil;
