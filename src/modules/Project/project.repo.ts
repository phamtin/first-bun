import type { ObjectId, WithoutId } from "mongodb";
import dayjs from "dayjs";
import { ProjectColl } from "@/loaders/mongo";
import type { GetProjectByIdResponse } from "./project.validator";

import { ProjectStatus, type ExtendProjectModel, type ProjectModel } from "../../database/model/project/project.model";
import { AppError } from "@/utils/error";
import type { Context } from "hono";
import { toObjectId } from "@/pkgs/mongodb/helper";
import { toPayloadUpdate } from "@/utils/transfrom";
import type { DeepPartial } from "@/types/common.type";

const getMyProjects = async (ctx: Context): Promise<ProjectModel[]> => {
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
	}).toArray()) as ProjectModel[];

	return res;
};

const getProjectById = async (ctx: Context, id: string): Promise<GetProjectByIdResponse> => {
	const res = (await ProjectColl.aggregate([
		{
			$match: {
				_id: toObjectId(id),

				status: {
					$ne: ProjectStatus.Archived,
				},
				deletedAt: {
					$exists: false,
				},
			},
		},
		{
			$lookup: {
				from: "accounts",
				localField: "createdBy",
				foreignField: "_id",
				as: "created",
			},
		},
		{
			$unwind: {
				path: "$created",
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
										$ne: ["$status", ProjectStatus.Archived],
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
				"created.accountSettings": 0,
			},
		},
	]).toArray()) as [ProjectModel & ExtendProjectModel];

	if (!res.length || res.length > 1) {
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
	if (payload.participantInfo) {
		payload.participantInfo.owner = undefined;
	}

	payload.updatedAt = dayjs().toDate();

	const updated: ProjectModel | null = await ProjectColl.findOneAndUpdate(
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

const ProjectRepo = {
	getMyProjects,
	createProject,
	getProjectById,
	updateProject,
	deleteProject,
};

export default ProjectRepo;
