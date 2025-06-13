import AccountRepo from "./account.repo";
import type * as av from "./account.validator";
import dayjs from "@/shared/utils/dayjs";
import type { Context } from "@/shared/types/app.type";
import { AppError } from "@/shared/utils/error";
import { APINatsPublisher } from "@/api/init-nats";
import { NatsEvent } from "@/shared/nats/types/events";

const getMyProfile = async (ctx: Context): Promise<av.GetMyProfileResponse> => {
	const myProfile = await AccountRepo.getMyProfile(ctx);
	return myProfile;
};

const findAccountProfile = async (ctx: Context, request: av.GetAccountProfileRequest): Promise<av.GetAccountProfileResponse> => {
	if (!request.accountId && !request.email) {
		throw new AppError("BAD_REQUEST", "Should use one criteria");
	}

	const account = await AccountRepo.findAccountProfile(ctx, request);
	return account;
};

const updateProfile = async (ctx: Context, request: av.UpdateProfileRequest): Promise<av.UpdateProfileResponse> => {
	if (request.profileInfo?.birthday) {
		if (!dayjs(request.profileInfo.birthday).isValid()) {
			throw new AppError("BAD_REQUEST", "Invalid birthday");
		}
	}

	const res = await AccountRepo.updateProfile(ctx, request);

	if (!res) throw new AppError("INTERNAL_SERVER_ERROR", "Internal Server Error");

	await APINatsPublisher.publish<(typeof NatsEvent)["SyncModel"]>(NatsEvent.SyncModel, { model: "accounts", payload: res });

	return res;
};

const AccountSrv = {
	getMyProfile,
	findAccountProfile,
	updateProfile,
};

export default AccountSrv;
