import { Context } from "@/types/app.type";
import { CreateTagRequest, CreateTagResponse, DeleteTagRequest, DeleteTagResponse, UpdateTagRequest, UpdateTagResponse } from "./tag.validator";
import systemLog from "@/pkgs/systemLog";
import AccountSrv from "../Accounts/account.srv";
import { TaskTag } from "../Accounts/account.model";
import { ObjectId } from "mongodb";
import AppError from "@/pkgs/appError/Error";

const createTag = async (ctx: Context, request: CreateTagRequest): Promise<CreateTagResponse> => {
	systemLog.info("createTag - START");

	const createdTag: TaskTag = {
		_id: new ObjectId().toHexString(),
		title: request.title,
		color: request.color,
	};

	const userTags = (await AccountSrv.getProfile(ctx)).profileInfo.tags || {};

	userTags[createdTag._id] = createdTag;

	await AccountSrv.updateProfile(ctx, { profileInfo: { tags: userTags } });

	systemLog.info("createTag - END");

	return userTags;
};

const updateTag = async (ctx: Context, request: UpdateTagRequest): Promise<UpdateTagResponse> => {
	systemLog.info("updateTag - START");

	const userTags = (await AccountSrv.getProfile(ctx)).profileInfo.tags || {};

	const tagToEdit: TaskTag = userTags[request.tagId];

	if (!tagToEdit) throw new AppError("NOT_FOUND");

	userTags[tagToEdit._id] = {
		_id: tagToEdit._id,
		title: request.title || tagToEdit.title,
		color: request.color || tagToEdit.color,
	};

	await AccountSrv.updateProfile(ctx, { profileInfo: { tags: userTags } });

	systemLog.info("updateTag - END");

	return userTags;
};

const deleteTag = async (ctx: Context, request: DeleteTagRequest): Promise<DeleteTagResponse> => {
	systemLog.info("deleteTag - START");

	const userTags = (await AccountSrv.getProfile(ctx)).profileInfo.tags || {};

	const tagToDel: TaskTag = userTags[request.tagId];

	if (!tagToDel) throw new AppError("NOT_FOUND");

	delete userTags[tagToDel._id];

	await AccountSrv.updateProfile(ctx, { profileInfo: { tags: userTags } });

	systemLog.info("deleteTag - END");

	return userTags;
};

const TagSrv = {
	createTag,
	updateTag,
	deleteTag,
};

export default TagSrv;
