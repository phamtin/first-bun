import { Static, t } from "elysia";
import { taskTagModel } from "./tag.model";

export const createTagRequest = t.Object({
	title: t.String(),
	color: t.String(),
});

export const createTagResponse = t.Record(t.String(), taskTagModel);
export const getTagsRequest = t.Object({
	ownerId: t.Optional(t.String()),
});

export const getTagsResponse = taskTagModel;

export const deleteTagRequest = t.Object({
	tagId: t.String(),
});

export const deleteTagResponse = t.Record(t.String(), taskTagModel);

export const updateTagRequest = t.Object({
	tagId: t.String(),
	title: t.Optional(t.String()),
	color: t.Optional(t.String()),
});

export const updateTagResponse = t.Record(t.String(), taskTagModel);

export type GetTagsRequest = Static<typeof getTagsRequest>;
export type GetTagsResponse = Static<typeof getTagsResponse>;
export type CreateTagRequest = Static<typeof createTagRequest>;
export type CreateTagResponse = Static<typeof createTagResponse>;
export type UpdateTagRequest = Static<typeof updateTagRequest>;
export type UpdateTagResponse = Static<typeof updateTagResponse>;
export type DeleteTagRequest = Static<typeof deleteTagRequest>;
export type DeleteTagResponse = Static<typeof deleteTagResponse>;
