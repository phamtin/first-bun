import { ProjectColl } from "@/shared/loaders/mongo";
import { toObjectId } from "@/shared/services/mongodb/helper";
import type { ProjectModel } from "@/shared/database/model/project/project.model";

export const checkUserIsParticipantProject = async (userId: string, projectId: string): Promise<[boolean, ProjectModel | null]> => {
	if (!userId || !projectId) {
		return [false, null];
	}

	const project = await ProjectColl.findOne({
		_id: toObjectId(projectId),
		deletedAt: {
			$exists: false,
		},
	});

	if (!project) return [false, null];

	if (project.participantInfo.owner._id.equals(userId)) {
		return [true, project];
	}

	for (const member of project.participantInfo.members) {
		if (member._id.toHexString() === userId) {
			return [true, project];
		}
	}

	return [false, null];
};

const ProjectUtil = {
	checkUserIsParticipantProject,
};

export default ProjectUtil;
