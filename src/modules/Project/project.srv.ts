import type { Context } from "hono";
import type { WithoutId } from "mongodb";
import type * as pv from "./project.validator";
import { toObjectId } from "@/pkgs/mongodb/helper";
import ProjectRepo from "./project.repo";
import { ProjectColl } from "@/loaders/mongo";
import { type ProjectInvitation, ProjectStatus, type ProjectModel } from "../../database/model/project/project.model";
import { AppError } from "@/utils/error";
import { buildPayloadUpdate } from "./project.mapper";
import AccountSrv from "../Accounts";
import ProjectUtil from "./project.util";
import dayjs from "@/utils/dayjs";
import TaskSrv from "../Tasks/task.srv";
import { DEFAULT_INVITATION_TITLE, PROJECT_INVITATION_EXPIRED_MINUTE } from "./project.const";

const getMyProjects = async (ctx: Context): Promise<pv.GetMyProjectsResponse[]> => {
	const project = await ProjectRepo.getMyProjects(ctx);
	return project;
};

const checkActiveProject = async (ctx: Context, projectId: string): Promise<ProjectModel | null> => {
	return ProjectRepo.checkActiveProject(ctx, projectId);
};

const getProjectById = async (ctx: Context, id: string): Promise<pv.GetProjectByIdResponse> => {
	const [canUserAccess, project] = await ProjectUtil.checkUserIsParticipantProject(ctx.get("user")._id, id);

	if (!canUserAccess) throw new AppError("NOT_FOUND", "You're not participant of project");

	if (!project) throw new AppError("NOT_FOUND", "Project not found");

	return ProjectRepo.getProjectById(ctx, id);
};

const createProject = async (ctx: Context, request: pv.CreateProjectRequest, isDefaultProject?: boolean): Promise<pv.CreateProjectResponse> => {
	const ownerId = toObjectId(ctx.get("user")._id);

	if (isDefaultProject) {
		const project = await ProjectColl.findOne({
			"participantInfo.owner._id": ownerId,
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
			invitations: [],
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

const updateProject = async (ctx: Context, projectId: string, request: pv.UpdateProjectRequest): Promise<pv.UpdateProjectResponse> => {
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

	const payload = buildPayloadUpdate(request, _project);

	if (!payload) throw new AppError("BAD_REQUEST", "Invalid payload");

	const isSuccess = await ProjectRepo.updateProject(ctx, projectId, payload);

	if (!isSuccess) {
		throw new AppError("INTERNAL_SERVER_ERROR");
	}

	return ProjectRepo.getProjectById(ctx, projectId);
};

const deleteProject = async (ctx: Context, projectId: string): Promise<boolean> => {
	const project = await checkActiveProject(ctx, projectId);

	if (!project) throw new AppError("NOT_FOUND", "Project not found");

	if (project.participantInfo.owner._id.toHexString() !== ctx.get("user")._id) {
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

const invite = async (ctx: Context, request: pv.InviteRequest): Promise<pv.InviteResponse> => {
	const project = await checkActiveProject(ctx, request.projectId);

	if (!project) throw new AppError("NOT_FOUND", "Project not found");

	if (!project.participantInfo.owner._id.equals(ctx.get("user")._id)) {
		throw new AppError("BAD_REQUEST", "Only owner can invite");
	}

	//	VALIDATE INVITEE's EMAIL
	const validEmails: string[] = [];
	const { participantInfo } = project;

	for (const requestEmail of request.emails) {
		if (participantInfo.owner.profileInfo.email !== requestEmail && participantInfo.members.map((mem) => mem.profileInfo.email).indexOf(requestEmail) === -1) {
			validEmails.push(requestEmail);
		}
	}
	if (validEmails.length === 0) {
		throw new AppError("BAD_REQUEST", "Invalid invitations");
	}

	const invitations: ProjectInvitation[] = [];
	const createdAt = dayjs().toDate();
	const expiredAt = dayjs().add(PROJECT_INVITATION_EXPIRED_MINUTE, "minute").toDate();

	for (const validEmail of validEmails) {
		invitations.push({
			email: validEmail,
			title: DEFAULT_INVITATION_TITLE,
			createdAt,
			expiredAt,
		});
	}

	//	ADD INVITATIONS TO PROJECT
	await ProjectColl.updateOne(
		{
			_id: toObjectId(request.projectId),
		},
		{
			$push: { "participantInfo.invitations": { $each: invitations } },
		}
	);

	//	CREATE NOTIFICATION

	return { success: true };
};

const responseInvitation = async (ctx: Context, request: pv.ResponseInvitationRequest): Promise<pv.ResponseInvitationResponse> => {
	const project = await checkActiveProject(ctx, request.projectId);

	if (!project) throw new AppError("NOT_FOUND", "Project not found");

	if (request.type === "reject") {
		return rejectInvitation(ctx, project, request.email);
	}

	if (request.type === "accept") {
		return acceptInvitation(ctx, project, request.email);
	}

	return { success: false };
};

const acceptInvitation = async (ctx: Context, project: ProjectModel, email: string): Promise<pv.ResponseInvitationResponse> => {
	const invitation = project.participantInfo.invitations.find((invitation) => {
		return invitation.email === email && dayjs().isBefore(invitation.expiredAt);
	});

	if (!invitation) throw new AppError("BAD_REQUEST", "Invitation link has expired :(");

	const invitee = await AccountSrv.findAccountProfile(ctx, { email });

	if (!invitee) throw new AppError("NOT_FOUND", "Invitee not found");

	const success = await ProjectRepo.addMemberToProject(ctx, project._id.toHexString(), invitee);

	//	CREATE NOTIFICATION

	return { success };
};

const rejectInvitation = async (ctx: Context, project: ProjectModel, email: string): Promise<pv.ResponseInvitationResponse> => {
	//	REMOVE INVITATION from PROJECT
	const r = await ProjectColl.updateOne(
		{
			_id: project._id,
		},
		{
			$pull: {
				"participantInfo.invitations": { email },
			},
			$set: {
				updatedAt: dayjs().toDate(),
			},
		}
	);

	//	CREATE NOTIFICATION

	return { success: r.acknowledged };
};

const removeMember = async (ctx: Context, request: pv.RemoveRequest): Promise<pv.RemoveResponse> => {
	const project = await checkActiveProject(ctx, request.projectId);

	if (!project) throw new AppError("NOT_FOUND", "Project not found");

	if (!project.participantInfo.owner._id.equals(ctx.get("user")._id)) {
		throw new AppError("BAD_REQUEST", "Only owner can invite");
	}

	const isSuccess = await ProjectRepo.removeMember(ctx, request.projectId, request.memberEmail);

	if (!isSuccess) {
		throw new AppError("INTERNAL_SERVER_ERROR");
	}

	return { success: true };
};

const ProjectSrv = {
	getMyProjects,
	updateProject,
	createProject,
	getProjectById,
	deleteProject,
	checkActiveProject,
	invite,
	responseInvitation,
	removeMember,
};

export default ProjectSrv;
