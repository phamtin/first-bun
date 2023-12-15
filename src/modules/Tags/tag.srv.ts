import {Context} from "@/types/app.type";
import {CreateTagRequest, CreateTagResponse} from "./tag.validator";
import systemLog from "@/pkgs/systemLog";
import TagRepo from "./tag.repo";

const createTag = async (ctx: Context, request: CreateTagRequest): Promise<CreateTagResponse> => {
  systemLog.info("createTag - START");

  const created = await TagRepo.createTag(ctx, request)

  return created;
}

const TagSrv = {
  createTag
}

export default TagSrv;