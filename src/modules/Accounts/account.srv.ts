import { Context } from "@/types/app.type";
import AccountRepo from "./account.repo";
import { GetMyProfileResponse, GetMyTasksRequest, GetMyTasksResponse } from "./account.validator";
import dayjs from "dayjs";
import AppError from "@/pkgs/appError/Error";

const getProfile = async (ctx: Context, request: any): Promise<GetMyProfileResponse> => {
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

const updateProfile = (ctx: Context, request: any) => {};

const AccountSrv = {
	getMyTasks,
	getProfile,
	updateProfile,
};

export default AccountSrv;
