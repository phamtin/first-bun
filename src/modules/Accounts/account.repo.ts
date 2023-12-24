import { Context } from "@/types/app.type";

import { GetMyProfileResponse, GetMyTasksRequest } from "./account.validator";
import { AccountColl, TaskColl } from "@/loaders/mongo";
import AppError from "@/pkgs/appError/Error";
import { ObjectId } from "mongodb";
import { TaskModel, TaskPriority } from "../Tasks/task.model";
import { AccountModel } from "./account.model";

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

const getMyTasks = async (ctx: Context, request: GetMyTasksRequest): Promise<TaskModel[]> => {
	const { query = "", startDate = [], endDate } = request;

	const excludedStatus = "Archived";

	const statusFilter = request.status?.filter((t) => t !== excludedStatus) || [];

	const priorities: TaskPriority[] = request.priorities || [];

	const tasks: TaskModel[] = (await TaskColl.aggregate([
		{
			$match: {
				ownerId: new ObjectId(ctx.user._id),

				$expr: {
					$and: [
						//	Apply search task
						{
							$cond: {
								if: {
									$gte: [query.length, 3],
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
							$switch: {
								branches: [
									{
										case: { $eq: [startDate.length, 1] },
										then: { $gte: ["$timing.startDate", { $toDate: startDate[0] }] },
									},
									{
										case: { $eq: [startDate.length, 2] },
										then: {
											$and: [
												{
													$gte: ["$timing.startDate", { $toDate: startDate[0] }],
												},
												{
													$lte: ["$timing.startDate", { $toDate: startDate[1] }],
												},
											],
										},
									},
								],
								default: {},
							},
						},
						//	Apply filter has endDate
						{
							$cond: {
								if: {
									$ne: [endDate, undefined],
								},
								then: {
									$lte: ["$timing.endDate", { $toDate: endDate }],
								},
								else: {},
							},
						},
					],
				},
			},
		},
		{
			$project: { title: 1, description: 1, status: 1, priority: 1 },
		},
	]).toArray()) as TaskModel[];

	return tasks;
};

const updateProfile = async (ctx: Context, request: Partial<AccountModel>): Promise<AccountModel> => {
	const updated = await AccountColl.findOneAndUpdate(
		{
			email: ctx.user.email,
		},
		{
			$set: {
				avatar: request.avatar,
				fullname: request.fullname,
				firstname: request.firstname,
				lastname: request.lastname,

				profileInfo: request.profileInfo,
				accountSetting: request.accountSetting,
			},
		},
		{
			ignoreUndefined: true,
			returnDocument: "after",
		}
	);

	if (!updated) throw new AppError("INTERNAL_SERVER_ERROR");

	return updated;
};

const AccountRepo = {
	getMyTasks,
	getProfile,
	updateProfile,
};

export default AccountRepo;
