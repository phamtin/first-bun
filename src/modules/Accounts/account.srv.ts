import { Context } from "@/types/app.type";
import AccountRepo from "./account.repo";
import { GetMyProfileResponse, GetMyTasksRequest, UpdateProfileRequest, GetMyTasksResponse } from "./account.validator";
import dayjs from "dayjs";
import AppError from "@/pkgs/appError/Error";
import { getAccountSettingUpdate, getProfileInfoUpdate } from "./account.helper";

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
	const payload: UpdateProfileRequest = {};

	payload.fullname = request.fullname ?? undefined;
	payload.firstname = request.firstname ?? undefined;
	payload.lastname = request.lastname ?? undefined;
	payload.avatar = request.avatar ?? undefined;

	payload.profileInfo = getProfileInfoUpdate(request.profileInfo);
	payload.accountSetting = getAccountSettingUpdate(request.accountSetting);

	const res = await AccountRepo.updateProfile(ctx, payload);

	return res;
};

const AccountSrv = {
	getMyTasks,
	getProfile,
	updateProfile,
};

export default AccountSrv;
