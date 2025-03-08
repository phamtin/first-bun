import type { ObjectId, WithoutId } from "mongodb";
import dayjs from "@/utils/dayjs";
import { ProjectColl } from "@/loaders/mongo";
import type { GetMyProjectsResponse, GetProjectByIdResponse } from "./project.validator";

import { ProjectStatus, type ExtendProjectModel, type ProjectModel } from "../../database/model/project/project.model";
import { AppError } from "@/utils/error";
import type { Context } from "hono";
import { toObjectId } from "@/pkgs/mongodb/helper";
import { toPayloadUpdate } from "@/utils/transfrom";
import type { DeepPartial } from "@/types/common.type";
import { TaskStatus } from "../../database/model/task/task.model";
import type { AccountModel } from "../../database/model/account/account.model";

const checkActiveProject = async (ctx: Context, projectId: string): Promise<ProjectModel | null> => {
	const p = await ProjectColl.findOne({
		_id: toObjectId(projectId),

		"projectInfo.status": {
			$ne: ProjectStatus.Archived,
		},
		deletedAt: {
			$exists: false,
		},
	});

	if (!p) return null;

	return p;
};

const getMyProjects = async (ctx: Context): Promise<GetMyProjectsResponse[]> => {
	const userId = toObjectId(ctx.get("user")._id);

	const res = (await ProjectColl.find({
		$or: [
			{
				"participantInfo.owner._id": userId,
			},
			{
				"participantInfo.members": { $elemMatch: { _id: userId } },
			},
		],
		status: {
			$ne: ProjectStatus.Archived,
		},
		deletedAt: {
			$exists: false,
		},
	})
		.project({ documents: 0 })
		.toArray()) as ProjectModel[];

	return res;
};

const getProjectById = async (ctx: Context, id: string): Promise<GetProjectByIdResponse> => {
	const res = (await ProjectColl.aggregate([
		{
			$match: {
				_id: toObjectId(id),

				deletedAt: { $exists: false },
			},
		},
		{
			$lookup: {
				from: "tasks",
				let: { projectId: "$_id" },
				pipeline: [
					{
						$match: {
							$expr: {
								$and: [
									{
										$eq: ["$projectId", "$$projectId"],
									},
									{
										$ne: ["$status", TaskStatus.Archived],
									},
									{
										$not: [{ $ifNull: ["$deletedAt", false] }],
									},
								],
							},
						},
					},
					{
						$project: {
							"assigneeInfo._id": 1,
							title: 1,
							status: 1,
							priority: 1,
							projectId: 1,
							timing: 1,
							createdAt: 1,
						},
					},
				],
				as: "tasks",
			},
		},
		{
			$project: {
				"participantInfo.owner.accountSettings": 0,
				"participantInfo.members.accountSettings": 0,
			},
		},
	]).toArray()) as [ProjectModel & ExtendProjectModel];

	if (res.length !== 1) {
		throw new AppError("INTERNAL_SERVER_ERROR", "Something went wrong");
	}

	return res[0];
};

const createProject = async (ctx: Context, payload: WithoutId<ProjectModel>): Promise<ObjectId> => {
	const data: WithoutId<ProjectModel> = {
		...payload,
	};

	const { acknowledged, insertedId } = await ProjectColl.insertOne(data);

	if (!acknowledged) throw new AppError("INTERNAL_SERVER_ERROR", "Fail to create project");

	return insertedId;
};

const updateProject = async (ctx: Context, projectId: string, payload: DeepPartial<ProjectModel>): Promise<boolean> => {
	if (payload.projectInfo) {
		payload.projectInfo.isDefaultProject = undefined;
	}

	payload.updatedAt = dayjs().toDate();

	const updated = await ProjectColl.findOneAndUpdate(
		{
			_id: toObjectId(projectId),
		},
		{
			$set: toPayloadUpdate(payload),
		},
		{
			ignoreUndefined: true,
			returnDocument: "after",
		}
	);

	return !!updated?._id;
};

const deleteProject = async (ctx: Context, projectId: string): Promise<boolean> => {
	const res = await ProjectColl.findOneAndUpdate(
		{
			_id: toObjectId(projectId),
		},
		{
			$set: {
				deletedAt: dayjs().toDate(),
				deletedBy: toObjectId(ctx.get("user")._id),
			},
		},
		{
			returnDocument: "after",
		}
	);

	return !!res?.deletedAt;
};

const addMemberToProject = async (ctx: Context, projectId: string, member: AccountModel): Promise<boolean> => {
	const updated = await ProjectColl.updateOne(
		{
			_id: toObjectId(projectId),
		},
		{
			$push: {
				"participantInfo.members": member,
			},
			$pull: {
				"participantInfo.invitations": {
					email: member.profileInfo.email,
				},
			},
			$set: {
				updatedAt: dayjs().toDate(),
			},
		}
	);

	return updated.acknowledged;
};

const removeMember = async (ctx: Context, projectId: string, memberEmail: string): Promise<boolean> => {
	const updated = await ProjectColl.updateOne(
		{
			_id: toObjectId(projectId),
		},
		{
			$pull: {
				"participantInfo.members": {
					"profileInfo.email": memberEmail,
				},
				"participantInfo.invitations": {
					email: memberEmail,
				},
			},
			$set: {
				updatedAt: dayjs().toDate(),
			},
		}
	);

	return updated.acknowledged;
};

const ProjectRepo = {
	getMyProjects,
	createProject,
	getProjectById,
	updateProject,
	deleteProject,
	checkActiveProject,
	addMemberToProject,
	removeMember,
};

export default ProjectRepo;
