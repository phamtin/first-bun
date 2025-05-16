import { FolderColl } from "@/shared/loaders/mongo";
import { toObjectId } from "@/shared/services/mongodb/helper";
import type { FolderModel } from "@/shared/database/model/folder/folder.model";

export const checkUserIsParticipantFolder = async (userId: string, folderId: string): Promise<[boolean, FolderModel | null]> => {
	if (!userId || !folderId) {
		return [false, null];
	}

	const folder = await FolderColl.findOne({
		_id: toObjectId(folderId),
		deletedAt: {
			$exists: false,
		},
	});

	if (!folder) return [false, null];

	if (folder.participantInfo.owner._id.equals(userId)) {
		return [true, folder];
	}

	for (const member of folder.participantInfo.members) {
		if (member._id.toHexString() === userId) {
			return [true, folder];
		}
	}

	return [false, null];
};

const FolderUtil = {
	checkUserIsParticipantFolder,
};

export default FolderUtil;
