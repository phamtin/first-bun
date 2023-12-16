import { Context } from "@/types/app.type";
import AccountRepo from "./account.repo";
import { GetMyProfileResponse, GetMyTasksRequest, UpdateProfileRequest, GetMyTasksResponse } from "./account.validator";
import dayjs from "@/utils/dayjs";
import AppError from "@/pkgs/appError/Error";
import { AccountModel } from "./account.model";
import { mergeAccountSettingWithDb, mergeProfileInfoWithDb } from "./account.helper";

const getProfile = async (ctx: Context): Promise<GetMyProfileResponse> => {
	const myProfile = await AccountRepo.getProfile(ctx);
	return myProfile;
};

const getMyTasks = async (ctx: Context, request: GetMyTasksRequest): Promise<GetMyTasksResponse> => {
	if (request.endDate) {
		const { startDate, endDate } = request;

		if (dayjs(endDate).isSameOrBefore(startDate, "minute")) {
			throw new AppError("BAD_REQUEST");
		}
	}

	const tasks = await AccountRepo.getMyTasks(ctx, request);

	return tasks;
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
		avatar: request.avatar,
		firstname: request.firstname,
		lastname: request.lastname,
		fullname: request.fullname,
	};
	if (request.profileInfo) {
		updator.profileInfo = mergeProfileInfoWithDb(currentProfile, request.profileInfo);
	}
	if (request.accountSetting) {
		updator.accountSetting = mergeAccountSettingWithDb(currentProfile, request.accountSetting);
	}

	const res = await AccountRepo.updateProfile(ctx, updator);

	return res;
};

const AccountSrv = {
	getMyTasks,
	getProfile,
	updateProfile,
};

export default AccountSrv;
