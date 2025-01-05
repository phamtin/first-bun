import type { Context } from "hono";
import type { WithoutId } from "mongodb";
import type { CreateProjectRequest, CreateProjectResponse, GetProjectByIdResponse, UpdateProjectRequest, UpdateProjectResponse } from "./project.validator";
import { toObjectId } from "@/pkgs/mongodb/helper";
import ProjectRepo from "./project.repo";
import { ProjectColl } from "@/loaders/mongo";
import { ProjectStatus, type ProjectModel } from "../../database/model/project/project.model";
import { AppError } from "@/utils/error";
import { buildPayloadUpdate } from "./project.mapper";
import AccountSrv from "../Accounts";
import type { AccountModel } from "../../database/model/account/account.model";
import projectUtil from "./project.util";
import dayjs from "dayjs";
import TaskSrv from "../Tasks/task.srv";

const getMyProjects = async (ctx: Context): Promise<ProjectModel[]> => {
	const project = await ProjectRepo.getMyProjects(ctx);
	return project;
};

const getProjectById = async (ctx: Context, id: string): Promise<GetProjectByIdResponse> => {
	const [canUserAccess] = await projectUtil.checkUserIsParticipantProject(ctx.get("user")._id, id);

	if (!canUserAccess) throw new AppError("NOT_FOUND", "You're not participant of project");

	const project = await ProjectRepo.getProjectById(ctx, id);

	return project;
};

const createProject = async (ctx: Context, request: CreateProjectRequest, isDefaultProject?: boolean): Promise<CreateProjectResponse> => {
	const ownerId = toObjectId(ctx.get("user")._id);

	if (isDefaultProject) {
		const project = await ProjectColl.findOne({
			"participantInfo.ownerId": ownerId,
			"projectInfo.isDefaultProject": true,
			deletedAt: {
				$exists: false,
			},
		});

		if (project) throw new AppError("BAD_REQUEST", "Hack CC");
	}

	const _ownerModel = await AccountSrv.findAccountProfile(ctx, { accountId: ctx.get("user")._id });

	if (!_ownerModel) throw new AppError("NOT_FOUND", "Project Owner not found");

	const { accountSettings, ...ownerModel } = _ownerModel;

	const payload: WithoutId<ProjectModel> = {
		projectInfo: {
			title: request.title,
			color: request.color,
			description: request.description ?? undefined,
			isDefaultProject: isDefaultProject ?? false,
			status: request.status ?? ProjectStatus.Planning,
		},
		participantInfo: {
			owner: ownerModel,
			members: [],
		},
		documents: {
			urls: [],
		},
		tags: [],
		createdAt: dayjs().toDate(),
		createdBy: ownerId,
	};

	const insertedId = await ProjectRepo.createProject(ctx, payload);

	return ProjectRepo.getProjectById(ctx, insertedId.toHexString());
};

const updateProject = async (ctx: Context, projectId: string, request: UpdateProjectRequest): Promise<UpdateProjectResponse> => {
	const _project: ProjectModel | null = await ProjectColl.findOne({
		_id: toObjectId(projectId),

		"projectInfo.status": {
			$ne: ProjectStatus.Archived,
		},
		deletedAt: {
			$exists: false,
		},
	});

	if (!_project) throw new AppError("NOT_FOUND", "Project not found");

	const payload = buildPayloadUpdate(request);

	if (!payload) throw new AppError("BAD_REQUEST", "Invalid payload");

	// Validate members payload
	if (request.memberIds) {
		if (!_project.participantInfo.owner._id.equals(ctx.get("user")._id)) {
			throw new AppError("INSUFFICIENT_PERMISSIONS", "You're must be owner to perform this action");
		}
		request.memberIds = request.memberIds.filter((id) => !_project.participantInfo.owner._id.equals(id)) || [];

		const promisor: Promise<AccountModel | null>[] = [];

		request.memberIds.map((id) => {
			promisor.push(
				AccountSrv.findAccountProfile(ctx, {
					accountId: id,
				})
			);
		});
		const validMembers = (await Promise.all(promisor)).filter((item) => !!item);

		if (validMembers.length !== request.memberIds.length) {
			throw new AppError("BAD_REQUEST", "Invalid members");
		}
		payload.participantInfo = {};
		payload.participantInfo.members = validMembers;
	}

	const isSuccess = await ProjectRepo.updateProject(ctx, projectId, payload);

	if (!isSuccess) {
		throw new AppError("INTERNAL_SERVER_ERROR");
	}

	return ProjectRepo.getProjectById(ctx, projectId);
};

const deleteProject = async (ctx: Context, projectId: string): Promise<boolean> => {
	const projectCount = await ProjectColl.countDocuments({
		_id: toObjectId(projectId),

		"participantInfo.ownerId": toObjectId(ctx.get("user")._id),

		deletedAt: {
			$exists: false,
		},
	});

	if (projectCount === 0) {
		throw new AppError("BAD_REQUEST", "Can't delete project");
	}

	const deletetaskPromisors: Promise<boolean>[] = [];

	const tasks = await TaskSrv.findTasksByProjectId(ctx, projectId);

	for (const task of tasks) {
		deletetaskPromisors.push(TaskSrv.deleteTask(ctx, task._id.toHexString()));
	}

	await Promise.all(deletetaskPromisors);

	const isDeleted = await ProjectRepo.deleteProject(ctx, projectId);

	if (!isDeleted) throw new AppError("INTERNAL_SERVER_ERROR");

	return true;
};

const ProjectSrv = {
	getMyProjects,
	updateProject,
	createProject,
	getProjectById,
	deleteProject,
};

export default ProjectSrv;
