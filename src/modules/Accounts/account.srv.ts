import { Context } from "@/types/app.type";
import AccountRepo from "./account.repo";
import { GetMyProfileResponse, GetMyTasksRequest, GetMyTasksResponse } from "./account.validator";

const getProfile = async (ctx: Context, request: any): Promise<GetMyProfileResponse> => {
	const myProfile = await AccountRepo.getProfile(ctx);
	return myProfile;
};

const getMyTasks = async (ctx: Context, request: GetMyTasksRequest): Promise<GetMyTasksResponse> => {
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
