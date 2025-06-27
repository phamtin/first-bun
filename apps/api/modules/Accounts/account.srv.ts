import { APINatsPublisher } from "@/api/init-nats";
import { AccountStatus } from "@/shared/database/model/account/account.model";
import { AccountColl } from "@/shared/loaders/mongo";
import { NatsEvent } from "@/shared/nats/types/events";
import { toObjectId } from "@/shared/services/mongodb/helper";
import type { Context } from "@/shared/types/app.type";
import dayjs from "@/shared/utils/dayjs";
import { AppError } from "@/shared/utils/error";
import AccountRepo from "./account.repo";
import type * as av from "./account.validator";

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

	await APINatsPublisher.publish<(typeof NatsEvent)["SyncModel"]>(NatsEvent.SyncModel, {
		ctx,
		model: "accounts",
		payload: res,
	});

	return res;
};

const deactivateAccount = async (ctx: Context): Promise<boolean> => {
	const r = await AccountColl.updateOne(
		{
			_id: toObjectId(ctx.user._id),
		},
		{
			$set: {
				"profileInfo.status": AccountStatus.Deactivated,
				updatedAt: dayjs().toDate(),
			},
		},
	);

	return r.acknowledged;
};

const AccountSrv = {
	getMyProfile,
	findAccountProfile,
	updateProfile,
	deactivateAccount,
};

export default AccountSrv;
