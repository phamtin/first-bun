import AccountRepo from "./account.repo";
import type { GetMyProfileResponse, UpdateProfileRequest, GetAccountProfileRequest, GetAccountProfileResponse, UpdateProfileResponse } from "./account.validator";
import dayjs from "@/utils/dayjs";
import type { Context } from "@/types/app.type";
import { AppError } from "@/utils/error";
import { addSyncModelJob } from "@/pkgs/bullMQ/queue/SyncModel.queue";

const getMyProfile = async (ctx: Context): Promise<GetMyProfileResponse> => {
	const myProfile = await AccountRepo.getMyProfile(ctx);
	return myProfile;
};

const findAccountProfile = async (ctx: Context, request: GetAccountProfileRequest): Promise<GetAccountProfileResponse> => {
	const account = await AccountRepo.findAccountProfile(ctx, request);
	return account;
};

const updateProfile = async (ctx: Context, request: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
	if (request.profileInfo?.birthday) {
		if (!dayjs(request.profileInfo.birthday).isValid()) {
			throw new AppError("BAD_REQUEST", "Invalid birthday");
		}
	}

	const res = await AccountRepo.updateProfile(ctx, request);

	if (!res) throw new AppError("INTERNAL_SERVER_ERROR", "Internal Server Error");

	await addSyncModelJob({ model: "accounts", payload: res });

	return res;
};

const AccountSrv = {
	getMyProfile,
	findAccountProfile,
	updateProfile,
};

export default AccountSrv;
