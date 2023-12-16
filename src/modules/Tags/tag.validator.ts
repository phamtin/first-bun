import {Static, t} from "elysia";
import {tagModel} from "./tag.model";

export const createTagRequest = t.Object({
  title: t.String(),
  color: t.String()
});

export const createTagResponse = tagModel;

export type CreateTagRequest = Static<typeof createTagRequest>;
export type CreateTagResponse = Static<typeof createTagResponse>;