import { Context } from "@/types/app.type";
import { CreateTagRequest, CreateTagResponse } from "./tag.validator";
import { TagModel } from "./tag.model";
import { ObjectId } from "mongodb";
import { TagColl } from "@/loaders/mongo";

const createTag = async (ctx: Context, request: CreateTagRequest): Promise<CreateTagResponse> => {
	const now = new Date();

	const data: TagModel = {
		_id: new ObjectId(),
		title: request.title,
		color: request.color,
		ownerId: new ObjectId(ctx.user._id),
		createdAt: now,
		updatedAt: now,
	};

	await TagColl.insertOne(data);

	return {
		...data,
		_id: data._id.toHexString(),
		ownerId: ctx.user._id,
	};
};

const TagRepo = {
	createTag,
};

export default TagRepo;
