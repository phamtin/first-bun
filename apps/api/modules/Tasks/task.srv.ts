import type { Context } from "hono";
import { ObjectId, type WithoutId } from "mongodb";
import type * as tv from "./task.validator";
import { toObjectId } from "@/shared/services/mongodb/helper";
import TaskRepo from "./task.repo";
import dayjs from "@/shared/utils/dayjs";
import { TaskColl } from "@/shared/loaders/mongo";
import type { TaskModel, TaskTiming } from "@/shared/database/model/task/task.model";
import type { AccountModel } from "@/shared/database/model/account/account.model";
import { AppError } from "@/shared/utils/error";
import AccountSrv from "../Accounts";
import FolderUtil from "../Folder/folder.util";
import { buildPayloadCreateTask, buildPayloadUpdateTask } from "./task.mapper";
import type { FolderModel } from "@/shared/database/model/folder/folder.model";
import FolderSrv from "../Folder/folder.srv";

const findById = async (ctx: Context, id: string): Promise<tv.GetTaskByIdResponse> => {
	const task = await TaskRepo.findById(ctx, id);
	return task;
};

const getTasks = async (ctx: Context, request: tv.GetTasksRequest): Promise<tv.GetTasksResponse> => {
	if (request.endDate) {
		const { startDate, endDate } = request;

		if (startDate) {
			if (dayjs(endDate).isSameOrBefore(startDate, "second")) {
				throw new AppError("BAD_REQUEST", "Start date - end date range is invalid");
			}
		}
	}
	const [folderCreatedByMe, folderSharedWithMe] = await Promise.all([FolderSrv.getFoldersCreatedByMe(ctx, {}), FolderSrv.getFoldersSharedWithMe(ctx, {})]);

	const grandFolderIds = folderCreatedByMe.concat(folderSharedWithMe).map((f) => f._id.toHexString());

	const requestFolderIds = request.folderIds || [];

	if (requestFolderIds.length > 0) {
		if (requestFolderIds.some((id) => grandFolderIds.indexOf(id) === -1)) {
			throw new AppError("BAD_REQUEST", "You're not participant of folder");
		}
		request.folderIds = requestFolderIds;
	} else {
		request.folderIds = grandFolderIds;
	}

	const tasks = await TaskRepo.getTasks(ctx, request);

	return tasks;
};

const createTask = async (ctx: Context, request: tv.CreateTaskRequest): Promise<tv.CreateTaskResponse> => {
	if (request.timing) {
		const { startDate, endDate } = request.timing;

		if (startDate) {
			if (!dayjs(startDate).isValid()) {
				throw new AppError("BAD_REQUEST");
			}
		}
		if (endDate) {
			const headOfTime = startDate ?? new Date();

			if (!dayjs(endDate).isValid()) {
				throw new AppError("BAD_REQUEST");
			}
			if (dayjs(endDate).isSameOrBefore(headOfTime, "second")) {
				throw new AppError("BAD_REQUEST", "End start is invalid");
			}
		}
	}

	const payload: WithoutId<TaskModel> | undefined = buildPayloadCreateTask(ctx, request);

	if (!payload) throw new AppError("BAD_REQUEST", "Invalid payload");

	const [canUserAccess, folder] = await FolderUtil.checkUserIsParticipantFolder(ctx.get("user")._id, request.folderId);

	if (!canUserAccess || !folder) {
		throw new AppError("INSUFFICIENT_PERMISSIONS", "You're not participant of folder");
	}

	const assigneeId = request.assigneeId ?? ctx.get("user")._id;

	const assigneeAccount = await AccountSrv.findAccountProfile(ctx, {
		accountId: assigneeId,
	});

	if (!assigneeAccount) throw new AppError("NOT_FOUND", "Assignee not found");

	const { accountSettings, ...restProps } = assigneeAccount; //	exclude accountSettings

	payload.assigneeInfo = [restProps];

	if (request.subTasks) {
		payload.subTasks = request.subTasks.map((subTask) => ({
			...subTask,
			_id: toObjectId(new ObjectId()),
		}));
	}

	if (request.tags) {
		if (!folder.tags?.length) {
			throw new AppError("BAD_REQUEST", "Invalid tags");
		}
		const validTags: ObjectId[] = [];
		const folderTagSet = new Set(folder.tags.map((tag) => tag._id.toHexString()));

		for (const tag of request.tags) {
			if (folderTagSet.has(tag)) {
				validTags.push(toObjectId(tag));
			}
		}
		if (!validTags.length) {
			throw new AppError("BAD_REQUEST", "Invalid tagss");
		}

		payload.tags = validTags;
	}

	const created = await TaskRepo.createTask(ctx, payload);

	return created;
};

const validateDateRange = (timingDb?: TaskTiming, timingRequest?: tv.UpdateTaskRequest["timing"]): boolean => {
	if (!timingRequest) return true;

	let isValid = true;

	const { startDate, endDate } = timingRequest;

	if (!startDate && !endDate) {
		return isValid;
	}

	if (timingDb?.endDate) {
		if (startDate && !endDate) {
			if (dayjs(startDate).isAfter(timingDb.endDate, "second")) {
				isValid = false;
			}
		}
	}
	if (timingDb?.startDate) {
		if (!startDate && endDate) {
			if (dayjs(startDate).isAfter(timingDb.endDate, "second")) {
				isValid = false;
			}
		}
	}

	return isValid;
};

const updateTask = async (ctx: Context, taskId: string, request: tv.UpdateTaskRequest): Promise<tv.UpdateTaskResponse> => {
	const aa = performance.now();
	if (request.timing) {
		const { startDate, endDate } = request.timing;

		const dayjsEndDate = dayjs(endDate);

		if (!dayjs(startDate).isValid() || !dayjsEndDate.isValid()) {
			throw new AppError("BAD_REQUEST", "Invalid date");
		}

		if (startDate && endDate) {
			if (dayjsEndDate.isSameOrBefore(startDate, "second")) {
				throw new AppError("BAD_REQUEST", "Invalid end date");
			}
		}
	}
	const payload = buildPayloadUpdateTask(ctx, request);

	if (!payload) throw new AppError("BAD_REQUEST", "Invalid payload");

	const promisors: Promise<TaskModel | AccountModel | null>[] = [
		TaskColl.findOne({
			_id: toObjectId(taskId),
			deletedAt: {
				$exists: false,
			},
		}),
	];

	if (request.assigneeId) {
		promisors.push(AccountSrv.findAccountProfile(ctx, { accountId: request.assigneeId }));
	}
	console.log("Duration API [1]", performance.now() - aa);

	const [task, assignee] = await Promise.all(promisors);
	const bb = performance.now();

	if (!task) throw new AppError("NOT_FOUND", "Task not found");

	const isValidDate = validateDateRange((task as TaskModel).timing, request.timing);

	if (!isValidDate) throw new AppError("BAD_REQUEST", "Invalid date range");

	console.log("Duration API [2]", performance.now() - bb);

	const [canUserAccess, folder] = await FolderUtil.checkUserIsParticipantFolder(ctx.get("user")._id, (task as TaskModel).folderId.toHexString());

	const cc = performance.now();

	if (!canUserAccess || !folder) {
		throw new AppError("INSUFFICIENT_PERMISSIONS", "You're not participant of folder");
	}

	if (request.tags) {
		let isValid = true;
		const taskTags = [];

		const folderTagStringIds = (folder.tags || []).map((t) => t._id.toHexString());

		for (const tag of request.tags) {
			if (folderTagStringIds.indexOf(tag) === -1) {
				isValid = false;
				break;
			}
			taskTags.push(toObjectId(tag));
		}
		if (!isValid) throw new AppError("BAD_REQUEST", "Invalid tag list");

		payload.tags = taskTags;
	}

	if (request.assigneeId) {
		if (!assignee) throw new AppError("NOT_FOUND", "Assignee not found");

		const assigneeProfile = assignee as AccountModel;
		const { accountSettings, ...profile } = assigneeProfile;
		payload.assigneeInfo = [profile];
	}

	if (Array.isArray(request.subTasks)) {
		if (request.subTasks.length === 0) {
			payload.subTasks = [];
		} else {
			const subTasks = request.subTasks.map((subTask) => ({
				...subTask,
				_id: subTask._id ? toObjectId(subTask._id) : new ObjectId(),
			}));
			payload.subTasks = subTasks;
		}
	}
	console.log("Duration API [3]", performance.now() - cc);
	const res = await TaskRepo.updateTask(ctx, taskId, payload, task as TaskModel);

	if (!res?._id) {
		throw new AppError("INTERNAL_SERVER_ERROR");
	}

	return res;
};

const deleteTask = async (ctx: Context, taskId: string): Promise<boolean> => {
	const accountId = toObjectId(ctx.get("user")._id);

	const taskCount = await TaskColl.countDocuments({
		_id: toObjectId(taskId),
		$or: [
			{
				createdBy: accountId,
			},
			{
				assigneeId: accountId,
			},
		],
		deletedAt: {
			$exists: false,
		},
	});

	if (taskCount === 0) throw new AppError("BAD_REQUEST", "Can't delete task");

	const isDeleted = await TaskRepo.deleteTask(ctx, taskId);

	if (!isDeleted) throw new AppError("INTERNAL_SERVER_ERROR");

	return true;
};

const findTasksByFolderIds = async (ctx: Context, folderIds: string[]): Promise<tv.GetTasksResponse> => {
	let promisors: Promise<[boolean, FolderModel | null]>[] = [];

	for (const folderId of folderIds) {
		promisors = promisors.concat(FolderUtil.checkUserIsParticipantFolder(ctx.get("user")._id, folderId));
	}

	const results = await Promise.all(promisors);

	for (const [canUserAccess, folder] of results) {
		if (!canUserAccess) {
			throw new AppError("INSUFFICIENT_PERMISSIONS", "You're not participant of folder");
		}
		if (!folder) {
			throw new AppError("NOT_FOUND", "Folder not found");
		}
	}

	return await TaskRepo.findTasksByFolderIds(ctx, folderIds);
};

const TaskSrv = {
	updateTask,
	createTask,
	findById,
	getTasks,
	deleteTask,
	findTasksByFolderIds,
};

export default TaskSrv;
