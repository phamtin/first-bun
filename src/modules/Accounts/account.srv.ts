import { Context } from "@/types/app.type";
import AccountRepo from "./account.repo";
import { GetMyProfileResponse, GetMyTasksRequest, UpdateProfileRequest, GetMyTasksResponse } from "./account.validator";
import dayjs from "@/utils/dayjs";
import AppError from "@/pkgs/appError/Error";
import { AccountModel } from "./account.model";
import { mergeAccountSettingWithDb, mergeProfileInfoWithDb } from "./account.helper";
import { TaskModel } from "../Tasks/task.model";
import systemLog from "@/pkgs/systemLog";

const getProfile = async (ctx: Context): Promise<GetMyProfileResponse> => {
	const myProfile = await AccountRepo.getProfile(ctx);
	return myProfile;
};

const getMyTasks = async (ctx: Context, request: GetMyTasksRequest): Promise<GetMyTasksResponse> => {
	let res: GetMyTasksResponse = [];

	if (request.startDate) {
		if (![1, 2].includes(request.startDate.length)) {
			throw new AppError("BAD_REQUEST", "Start date range must have 2 values");
		}
		if (dayjs(request.startDate[1]).isSameOrBefore(request.startDate[0], "second")) {
			throw new AppError("BAD_REQUEST", "Start date range is invalid");
		}
	}
	if (request.endDate) {
		const { startDate, endDate } = request;

		if (![1, 2].includes(endDate.length)) {
			throw new AppError("BAD_REQUEST");
		}
		if (dayjs(endDate[1]).isSameOrBefore(endDate[0], "second")) {
			throw new AppError("BAD_REQUEST");
		}
		if (startDate) {
			if (dayjs(endDate[0]).isSameOrBefore(startDate[1], "second")) {
				throw new AppError("BAD_REQUEST", "Start date - end date range is invalid");
			}
		}
	}

	let tasks: TaskModel[] = await AccountRepo.getMyTasks(ctx, request);

	res = tasks.map((task) => ({
		_id: task._id.toHexString(),
		title: task.title,
		description: task.description || "",
		status: task.status,
		priority: task.priority,
	}));

	return res;
};

const updateProfile = async (ctx: Context, request: UpdateProfileRequest): Promise<boolean> => {
	systemLog.info("updateProfile - START");

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

	systemLog.info("updateProfile - END");

	return true;
};

const AccountSrv = {
	getMyTasks,
	getProfile,
	updateProfile,
};

export default AccountSrv;
