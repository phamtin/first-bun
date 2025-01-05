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
				preserveNullAndEmptyArrays: true,
			},
		},
		{
			$lookup: {
				from: "tasks",
				localField: "_id",
				foreignField: "projectId",
				as: "tasks",
			},
		},
		{
			$addFields: {
				tasks: {
					$filter: {
						input: "$tasks",
						as: "task",
						cond: {
							$and: [{ $not: [{ $ifNull: ["$$task.deletedAt", false] }] }, { $ne: ["$$task.status", ProjectStatus.Archived] }],
						},
					},
				},
			},
		},
		{
			$project: {
				"participantInfo.owner.accountSettings": 0,
				"participantInfo.members.accountSettings": 0,
				"created.accountSettings": 0,

				"tasks.tags": 0,
				"tasks.description": 0,
				"tasks.assigneeInfo": 0,
				"tasks.additionalInfo": 0,
				"tasks.subTasks": 0,
				"tasks.updatedAt": 0,
				"tasks.createdBy": 0,
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
	payload.updatedAt = dayjs().toDate();

	console.log("CHECK: ", JSON.parse(JSON.stringify(toPayloadUpdate(payload), null, 4)));

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
