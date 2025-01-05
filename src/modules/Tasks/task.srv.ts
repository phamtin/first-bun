import type { Context } from "hono";
import type { WithoutId } from "mongodb";
import type {
	CreateTaskRequest,
	CreateTaskResponse,
	GetMyTasksRequest,
	GetMyTasksResponse,
	GetTaskByIdResponse,
	GetTasksResponse,
	UpdateTaskRequest,
	UpdateTaskResponse,
} from "./task.validator";
import { toObjectId } from "@/pkgs/mongodb/helper";
import systemLog from "@/pkgs/systemLog";
import TaskRepo from "./task.repo";
import dayjs from "@/utils/dayjs";
import { TaskColl } from "@/loaders/mongo";
import { TaskStatus, type TaskModel, type TaskTiming } from "../../database/model/task/task.model";
import type { AccountModel } from "../../database/model/account/account.model";
import { AppError } from "@/utils/error";
import AccountSrv from "../Accounts";
import ProjectUtil from "../Project/project.util";

const getTaskById = async (ctx: Context, id: string): Promise<GetTaskByIdResponse> => {
	const task = await TaskRepo.getTaskById(ctx, id);
	return task;
};

const getMyTasks = async (ctx: Context, request: GetMyTasksRequest): Promise<GetMyTasksResponse> => {
	if (request.startDate) {
		const { startDate } = request;

		if (![1, 2].includes(startDate.length)) {
			throw new AppError("BAD_REQUEST", "Start date range must have 1 or 2 values");
		}
		if (dayjs(startDate[1]).isSameOrBefore(startDate[0], "second")) {
			throw new AppError("BAD_REQUEST", "Start date range is invalid");
		}
	}
	if (request.endDate) {
		const { startDate, endDate } = request;

		if (![1, 2].includes(endDate.length)) {
			throw new AppError("BAD_REQUEST", "Bad request");
		}
		if (dayjs(endDate[1]).isSameOrBefore(endDate[0], "second")) {
			throw new AppError("BAD_REQUEST", "Bad request");
		}
		if (startDate) {
			if (dayjs(endDate[0]).isSameOrBefore(startDate[1], "second")) {
				throw new AppError("BAD_REQUEST", "Start date - end date range is invalid");
			}
		}
	}

	const tasks: TaskModel[] = await TaskRepo.getMyTasks(ctx, request);

	return tasks;
};

const createTask = async (ctx: Context, request: CreateTaskRequest): Promise<CreateTaskResponse> => {
	systemLog.info("createTask - START");

	const payload: WithoutId<TaskModel> = {
		title: request.title,
		priority: request.priority,
		description: request.description,
		additionalInfo: request.additionalInfo,

		tags: [],
		projectId: toObjectId(request.projectId),
		status: request.status ?? TaskStatus.NotStartYet,

		createdAt: new Date(),
		createdBy: toObjectId(ctx.get("user")._id),
	};

	const [canUserAccess] = await ProjectUtil.checkUserIsParticipantProject(ctx.get("user")._id, request.projectId);

	if (!canUserAccess) throw new AppError("INSUFFICIENT_PERMISSIONS", "You're not participant of project");

	const assigneeId = request.assigneeId ?? ctx.get("user")._id;

	const assigneeAccount = await AccountSrv.findAccountProfile(ctx, { accountId: assigneeId });

	if (!assigneeAccount) throw new AppError("NOT_FOUND", "Assignee not found");

	const { accountSettings, ...restProps } = assigneeAccount;

	payload.assigneeInfo = [restProps];

	if (request.timing) {
		const { startDate, endDate, estimation } = request.timing;

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
		payload.timing = {};

		if (startDate) {
			payload.timing.startDate = dayjs(startDate).toDate();
		}
		if (endDate) {
			payload.timing.endDate = dayjs(endDate).toDate();
		}
		if (estimation) {
			payload.timing.estimation = estimation as TaskTiming["estimation"];
		}
	}

	if (request.subTasks) {
		payload.subTasks = request.subTasks.map((subTask) => ({
			...subTask,
			status: subTask.status ?? TaskStatus.NotStartYet,
		}));
	}

	const created = await TaskRepo.createTask(ctx, payload);

	systemLog.info("createTask - END");

	return created;
};

const validateDateRange = (timingDb?: TaskTiming, timingRequest?: UpdateTaskRequest["timing"]): boolean => {
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

const updateTask = async (ctx: Context, taskId: string, request: UpdateTaskRequest): Promise<UpdateTaskResponse> => {
	const payload: Partial<TaskModel> = {
		title: request.title,
		status: request.status,
		priority: request.priority,
		description: request.description,
		additionalInfo: request.additionalInfo,
		subTasks: request.subTasks,
	};

	if (request.timing) {
		const { startDate, endDate, estimation } = request.timing;

		if (!dayjs(startDate).isValid() || !dayjs(endDate).isValid()) {
			throw new AppError("BAD_REQUEST", "Invalid date");
		}

		if (startDate && endDate) {
			if (dayjs(endDate).isSameOrBefore(startDate, "second")) {
				throw new AppError("BAD_REQUEST", "Invalid end date");
			}
		}
		payload.timing = {};

		if (request.timing.startDate) {
			payload.timing.startDate = dayjs(startDate).toDate();
		}
		if (request.timing.endDate) {
			payload.timing.endDate = dayjs(endDate).toDate();
		}
		if (request.timing.estimation) {
			payload.timing.estimation = estimation as TaskTiming["estimation"];
		}
	}

	const promisors: Promise<TaskModel | AccountModel | null>[] = [
		TaskColl.findOne({
			_id: toObjectId(taskId),
			deletedAt: {
				$exists: false,
			},
		}),
	];
	if (request.assigneeId) {
		promisors.push(
			AccountSrv.findAccountProfile(ctx, {
				accountId: request.assigneeId,
			})
		);
	}

	const [task, account] = await Promise.all(promisors);

	if (!task) throw new AppError("NOT_FOUND", "Task not found");

	const [canUserAccess, project] = await ProjectUtil.checkUserIsParticipantProject(ctx.get("user")._id, (task as TaskModel).projectId.toHexString());

	if (!canUserAccess) throw new AppError("INSUFFICIENT_PERMISSIONS", "You're not participant of project");

	const isValidDate = validateDateRange((task as TaskModel).timing, request.timing);

	if (!isValidDate) throw new AppError("BAD_REQUEST", "Invalid date range");

	if (request.tags) {
		if (!project) throw new AppError("INTERNAL_SERVER_ERROR");

		let isValid = true;
		const taskTags = [];

		for (const tag of request.tags) {
			if ((project.tags || []).map((t) => t._id.toHexString()).indexOf(tag) === -1) {
				isValid = false;
				break;
			}
			taskTags.push(toObjectId(tag));
		}
		if (!isValid) throw new AppError("BAD_REQUEST", "Invalid tag list");

		payload.tags = taskTags;
	}

	if (request.assigneeId) {
		if (!account) {
			throw new AppError("NOT_FOUND", "Assignee not found");
		}
		const assigneeProfile = account as AccountModel;
		const { accountSettings, ...profile } = assigneeProfile;
		payload.assigneeInfo = [profile];
	}

	const res = await TaskRepo.updateTask(ctx, taskId, payload);

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

const findTasksByProjectId = async (ctx: Context, projectId: string): Promise<GetTasksResponse> => {
	const tasks = await TaskColl.find({
		projectId: toObjectId(projectId),
		deletedAt: {
			$exists: false,
		},
	}).toArray();

	return tasks;
};

const TaskSrv = {
	updateTask,
	createTask,
	getTaskById,
	getMyTasks,
	deleteTask,
	findTasksByProjectId,
};

export default TaskSrv;
