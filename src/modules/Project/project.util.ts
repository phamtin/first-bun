import { ProjectColl } from "@/loaders/mongo";
import { toObjectId } from "@/pkgs/mongodb/helper";
import type { ProjectModel } from "../../database/model/project/project.model";

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

	if (project.participantInfo.members.map((mem) => mem._id.toHexString()).includes(userId)) {
		return [true, project];
	}

	return [false, null];
};

const ProjectUtil = {
	checkUserIsParticipantProject,
};

export default ProjectUtil;
