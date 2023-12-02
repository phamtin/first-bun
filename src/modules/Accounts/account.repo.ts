import { Context } from "@/types/app.type";

import { GetMyProfileResponse, GetMyTasksResponse, GetMyTasksRequest } from "./account.validator";
import { AccountColl, TaskColl } from "@/loaders/mongo";
import AppError from "@/pkgs/appError/Error";
import { ObjectId } from "mongodb";
import { TaskStatus } from "../Tasks/task.model";
import { StringId } from "@/types/common.type";

const getProfile = async (ctx: Context): Promise<GetMyProfileResponse> => {
	let profile = await AccountColl.findOne({
		email: ctx.user.email,
	});

	if (!profile) throw new AppError("NOT_FOUND");

	return {
		...profile,
		_id: profile._id.toHexString(),
	};
};

const getMyTasks = async (ctx: Context, request: GetMyTasksRequest): Promise<GetMyTasksResponse> => {
	const { query = "" } = request;

	const ignoreStatus: TaskStatus = "Archived";

	let tasks: StringId<GetMyTasksResponse> = (await TaskColl.aggregate([
		{
			$match: {
				ownerId: new ObjectId(ctx.user._id),

				//	exclude `Archived` type
				status: {
					$ne: ignoreStatus,
				},

				//	Apply when search task
				$expr: {
					$cond: {
						if: { $gt: [query.length, 2] },
						then: {
							$or: [
								{
									$regexMatch: {
										input: "$title",
										regex: query,
										options: "i",
									},
								},
								{
									$regexMatch: {
										input: "$description",
										regex: query,
										options: "i",
									},
								},
							],
						},
						else: {}, //	No apply filetr
					},
				},
			},
		},
		{
			$addFields: {
				_id: { $toString: "$_id" },
			},
		},
		{
			$project: {
				title: 1,
				description: 1,
				status: 1,
			},
		},
	]).toArray()) as any[];

	return tasks;
};

const updateProfile = (ctx: Context, request: any) => {};

const AccountRepo = {
	getMyTasks,
	getProfile,
	updateProfile,
};

export default AccountRepo;
