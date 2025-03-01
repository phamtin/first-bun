import dayjs from "@/utils/dayjs";
import type { GetAccountProfileRequest, GetAccountProfileResponse, GetMyProfileResponse, UpdateProfileRequest } from "./account.validator";
import { AccountColl } from "@/loaders/mongo";
import type { Filter } from "mongodb";
import { AppError } from "@/utils/error";
import type { AccountModel } from "../../database/model/account/account.model";
import type { Context } from "hono";
import type { DeepPartial } from "@/types/common.type";
import { toPayloadUpdate } from "@/utils/transfrom";
import { toObjectId } from "@/pkgs/mongodb/helper";

const getMyProfile = async (ctx: Context): Promise<GetMyProfileResponse> => {
	const profile = await AccountColl.findOne({
		"profileInfo.email": ctx.get("user").email,
	});

	if (!profile) throw new AppError("NOT_FOUND", "Profile not found");

	return {
		...profile,
		_id: toObjectId(ctx.get("user")._id),
	};
};

const findAccountProfile = async (ctx: Context, request: GetAccountProfileRequest): Promise<GetAccountProfileResponse> => {
	if (request.accountId && request.email) {
		throw new AppError("BAD_REQUEST", "Should use one criteria");
	}
	const filter: Filter<AccountModel> = {
		deletedAt: {
			$exists: false,
		},
	};
	if (request.accountId) {
		filter._id = toObjectId(request.accountId);
	}
	if (request.email) {
		filter["profileInfo.email"] = request.email;
	}

	const account = await AccountColl.findOne(filter);

	if (!account) return null;

	return account;
};

const updateProfile = async (ctx: Context, request: UpdateProfileRequest): Promise<AccountModel> => {
	const updator: DeepPartial<AccountModel> = {
		...request,
		profileInfo: {
			...request.profileInfo,
			birthday: request.profileInfo?.birthday ? dayjs(request.profileInfo.birthday).toDate() : undefined,
		},
		accountSettings: {
			...request.accountSettings,
			pinnedProjects: request.accountSettings?.pinnedProjects ? request.accountSettings.pinnedProjects.map((projectId) => toObjectId(projectId)) : undefined,
		},
		updatedAt: dayjs().toDate(),
	};

	const updated = await AccountColl.findOneAndUpdate(
		{
			_id: toObjectId(ctx.get("user")._id),
		},
		{
			$set: toPayloadUpdate(updator),
		},
		{
			ignoreUndefined: true,
			returnDocument: "after",
		}
	);

	if (!updated) throw new AppError("INTERNAL_SERVER_ERROR");

	return updated;
};

const AccountRepo = {
	getMyProfile,
	findAccountProfile,
	updateProfile,
};

export default AccountRepo;
