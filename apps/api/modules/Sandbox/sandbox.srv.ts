import type { Context } from "hono";
import { ObjectId, type WithoutId } from "mongodb";
import { toObjectId } from "@/shared/services/mongodb/helper";
import dayjs from "@/shared/utils/dayjs";
import { TaskColl } from "@/shared/loaders/mongo";
import type { TaskModel, TaskTiming } from "@/shared/database/model/task/task.model";
import type { AccountModel } from "@/shared/database/model/account/account.model";
import { AppError } from "@/shared/utils/error";
import AccountSrv from "../Accounts";
import FolderUtil from "../Folder/folder.util";

const bulkCreateTask = async (ctx: Context, request: WithoutId<TaskModel>[]): Promise<boolean> => {
	return true;
};

const SandboxSrv = {
	bulkCreateTask,
};

export default SandboxSrv;
