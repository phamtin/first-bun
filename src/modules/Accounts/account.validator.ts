import * as v from "valibot";
import type { InferInput } from "valibot";
import { objectId, stringObjectId } from "@/types/common.type";

import { type AccountModel, SigninMethod, Theme } from "../../database/model/account/account.model";

export const vAccountProfile = v.strictObject({
	_id: objectId,
	signinMethod: v.enum(SigninMethod),
	profileInfo: v.strictObject({
		email: v.string(),
		fullname: v.string(),
		firstname: v.string(),
		lastname: v.string(),
		phoneNumber: v.array(v.string()),
		birthday: v.optional(v.date()),
		locale: v.string(),
		avatar: v.string(),
	}),
	accountSettings: v.strictObject({
		theme: v.enum(Theme),
		isPrivateAccount: v.boolean(),
	}),
	createdAt: v.date(),
	createdBy: v.optional(objectId),
	updatedAt: v.optional(v.date()),
	deletedAt: v.optional(v.date()),
	deletedBy: v.optional(objectId),
}) satisfies v.BaseSchema<AccountModel, AccountModel, v.BaseIssue<unknown>>;

export const getMyProfileResponse = vAccountProfile;

export const updateProfileRequest = v.strictObject({
	signinMethod: v.optional(v.enum(SigninMethod)),
	profileInfo: v.optional(
		v.strictObject({
			email: v.optional(v.string()),
			fullname: v.optional(v.string()),
			firstname: v.optional(v.string()),
			lastname: v.optional(v.string()),
			phoneNumber: v.optional(v.array(v.string())),
			birthday: v.optional(v.string()),
			locale: v.optional(v.string()),
			avatar: v.optional(v.string()),
		})
	),
	accountSettings: v.optional(
		v.strictObject({
			theme: v.optional(v.enum(Theme)),
			isPrivateAccount: v.optional(v.boolean()),
		})
	),
	updatedAt: v.optional(v.string()),
});

export const getAccountProfileRequest = v.strictObject({
	accountId: v.optional(stringObjectId),
	email: v.optional(v.string()),
});

export const getAccountProfileResponse = vAccountProfile satisfies v.BaseSchema<AccountModel, AccountModel, v.BaseIssue<unknown>>;

export type GetMyProfileResponse = InferInput<typeof getMyProfileResponse>;
export type UpdateProfileRequest = InferInput<typeof updateProfileRequest>;
export type GetAccountProfileRequest = InferInput<typeof getAccountProfileRequest>;
export type GetAccountProfileResponse = InferInput<typeof getAccountProfileResponse>;
