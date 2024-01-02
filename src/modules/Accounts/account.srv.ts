import { Context } from "@/types/app.type";
import AccountRepo from "./account.repo";
import { Value } from "@sinclair/typebox/value";
import { GetMyProfileResponse, GetMyTasksRequest, UpdateProfileRequest, GetMyTasksResponse, getMyTasksResponse } from "./account.validator";
import dayjs from "@/utils/dayjs";
import AppError from "@/pkgs/appError/Error";
import { AccountModel } from "./account.model";
import { mergeAccountSettingWithDb, mergeProfileInfoWithDb } from "./account.helper";
import { TaskModel } from "../Tasks/task.model";

const getProfile = async (ctx: Context): Promise<GetMyProfileResponse> => {
	const myProfile = await AccountRepo.getProfile(ctx);
	return myProfile;
};

const getMyTasks = async (ctx: Context, request: GetMyTasksRequest): Promise<GetMyTasksResponse> => {
	let res = Value.Create(getMyTasksResponse);

	if (request.startDate) {
		const { startDate, endDate } = request;

		if (![1, 2].includes(startDate.length)) {
			throw new AppError("BAD_REQUEST");
		}
		if (dayjs(startDate[1]).isSameOrBefore(startDate[0], "second")) {
			throw new AppError("BAD_REQUEST");
		}
		if (endDate) {
			if (dayjs(endDate).isSameOrBefore(startDate[0], "second")) {
				throw new AppError("BAD_REQUEST");
			}
		}
	}

	let tasks: TaskModel[] = await AccountRepo.getMyTasks(ctx, request);

	res = tasks.map((task) => ({
		_id: task._id.toHexString(),
		title: task.title,
		description: task.description || "",
		status: task.status,
		priorities: task.priority,
	}));

	return res;
};

const updateProfile = async (ctx: Context, request: UpdateProfileRequest): Promise<boolean> => {
	if (request.profileInfo?.birthday) {
		if (!dayjs(request.profileInfo.birthday).isValid()) {
			throw new AppError("BAD_REQUEST");
		}
	}

	const currentProfile = await AccountRepo.getProfile(ctx);

	if (!currentProfile) throw new AppError("BAD_REQUEST");

	const updator: Partial<AccountModel> = {
		firstname: request.firstname,
		lastname: request.lastname,
		fullname: request.fullname,
		avatar: request.avatar,
	};

	if (request.profileInfo) {
		updator.profileInfo = mergeProfileInfoWithDb(currentProfile, request.profileInfo);
	}
	if (request.accountSetting) {
		updator.accountSetting = mergeAccountSettingWithDb(currentProfile, request.accountSetting);
	}

	const res = await AccountRepo.updateProfile(ctx, updator);

	if (!res) throw new AppError("INTERNAL_SERVER_ERROR");

	return true;
};

const AccountSrv = {
	getMyTasks,
	getProfile,
	updateProfile,
};

export default AccountSrv;
