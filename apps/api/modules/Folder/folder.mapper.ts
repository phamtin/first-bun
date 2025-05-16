import type { DeepPartial } from "@/shared/types/common.type";
import type { FolderModel } from "@/shared/database/model/folder/folder.model";
import type { UpdateFolderRequest } from "./folder.validator";
import { ObjectId } from "mongodb";
import { toObjectId } from "@/shared/services/mongodb/helper";

export const buildPayloadUpdate = (request: UpdateFolderRequest, model?: Readonly<FolderModel>): DeepPartial<FolderModel> | undefined => {
	let res: DeepPartial<FolderModel> | undefined = undefined;

	if (Object.keys(request).length === 0) return res;

	res = {} satisfies DeepPartial<FolderModel>;

	res.folderInfo = {} satisfies DeepPartial<FolderModel["folderInfo"]>;

	if (request.title) {
		res.folderInfo.title = request.title;
	}
	if (request.description) {
		res.folderInfo.description = request.description;
	}
	if (request.status) {
		res.folderInfo.status = request.status;
	}
	if (request.color) {
		res.folderInfo.color = request.color;
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
