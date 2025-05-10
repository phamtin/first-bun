import type { DeepPartial } from "@/shared/types/common.type";
import type { ProjectModel } from "@/shared/database/model/project/project.model";
import type { UpdateProjectRequest } from "./project.validator";
import { ObjectId } from "mongodb";
import { toObjectId } from "@/shared/services/mongodb/helper";

export const buildPayloadUpdate = (request: UpdateProjectRequest, model?: Readonly<ProjectModel>): DeepPartial<ProjectModel> | undefined => {
	let res: DeepPartial<ProjectModel> | undefined = undefined;

	if (Object.keys(request).length === 0) return res;

	res = {} satisfies DeepPartial<ProjectModel>;

	res.projectInfo = {} satisfies DeepPartial<ProjectModel["projectInfo"]>;

	if (request.title) {
		res.projectInfo.title = request.title;
	}
	if (request.description) {
		res.projectInfo.description = request.description;
	}
	if (request.status) {
		res.projectInfo.status = request.status;
	}
	if (request.color) {
		res.projectInfo.color = request.color;
	}
	if (request.tags) {
		const tagsToCreate = [];
		const tagsToUpdate = [];

		for (const tag of request.tags) {
			if (tag._id) {
				tagsToUpdate.push(tag);
			} else {
				tagsToCreate.push(tag);
			}
		}
		const newTags = tagsToCreate.map((tag) => {
			return {
				...tag,
				_id: new ObjectId(),
			};
		});

		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const mapping = {} as Record<string, any>;

		for (const tag of tagsToUpdate) {
			const tagId = tag._id as string;
			if (mapping[tagId]) {
				continue;
			}
			mapping[tagId] = tag;
		}
		const validTags = Object.values(mapping);

		res.tags = validTags.map((t) => ({ ...t, _id: toObjectId(t._id) })).concat(newTags);
	}

	return res;
};
