import { Context } from "@/types/app.type";

import { GetMyProfileResponse, GetMyTasksResponse, GetMyTasksRequest, UpdateProfileRequest } from "./account.validator";
import { AccountColl, TaskColl } from "@/loaders/mongo";
import AppError from "@/pkgs/appError/Error";
import { ObjectId } from "mongodb";
import { TaskPriority } from "../Tasks/task.model";
import { StringId } from "@/types/common.type";

const getProfile = async (ctx: Context): Promise<GetMyProfileResponse> => {
	let profile = await AccountColl.findOne({
		email: ctx.user.email,
	});

	if (!profile) throw new AppError("NOT_FOUND");

	return {
		...profile,
		_id: ctx.user._id,
	};
};

const getMyTasks = async (ctx: Context, request: GetMyTasksRequest): Promise<GetMyTasksResponse> => {
	const { query = "", startDate, endDate } = request;

	const statusFilter = request.status?.filter((t) => t !== "Archived") || [];

	const priorities: TaskPriority[] = request.priorities || [];

	const tasks: StringId<GetMyTasksResponse> = (await TaskColl.aggregate([
		{
			$match: {
				ownerId: new ObjectId(ctx.user._id),

				$expr: {
					$and: [
						//	Apply search task
						{
							$cond: {
								if: {
									$gt: [query.length, 2],
								},
								then: {
									$or: [
										{
											$regexMatch: { input: "$title", regex: query, options: "i" },
										},
										{
											$regexMatch: { input: "$description", regex: query, options: "i" },
										},
									],
								},
								else: {},
							},
						},
						//	Apply filter task status
						{
							$cond: {
								if: {
									$gte: [statusFilter.length, 1],
								},
								then: {
									$in: ["$status", statusFilter],
								},
								else: {},
							},
						},
						//	Apply filter task priority
						{
							$cond: {
								if: {
									$gte: [priorities.length, 1],
								},
								then: {
									$in: ["$priority", priorities],
								},
								else: {},
							},
						},
						//	Apply filter has startDate
						{
							$cond: {
								if: {
									$ne: [startDate, undefined],
								},
								then: {
									$gte: ["$timing.startDate", { $toDate: startDate }],
								},
								else: {},
							},
						},
						//	Apply filter has endDate
						{
							$cond: {
								if: {
									$ne: [endDate, undefined],
								},
								then: {
									$lte: ["$timing.endDate", { $toDate: startDate }],
								},
								else: {},
							},
						},
					],
				},
			},
		},
		{
			$addFields: {
				_id: { $toString: "$_id" },
			},
		},
		{
			$project: { title: 1, description: 1, status: 1 },
		},
	]).toArray()) as any[];

	return tasks;
};

const updateProfile = async (ctx: Context, request: UpdateProfileRequest): Promise<boolean> => {
	await AccountColl.findOneAndUpdate(
		{
			_id: new ObjectId(ctx.user._id),
		},
		{
			$set: {
				fullname: request.fullname,
				firstname: request.firstname,
				lastname: request.lastname,
				avatar: request.avatar,
				"profileInfo.phoneNumber": request.profileInfo?.phoneNumber,
				"accountSetting.theme": request.accountSetting?.theme,
				"accountSetting.isPrivateAccount": request.accountSetting?.isPrivateAccount,
			},
		},
		{
			ignoreUndefined: true,
		}
	);

	return true;
};

const AccountRepo = {
	getMyTasks,
	getProfile,
	updateProfile,
};

export default AccountRepo;
