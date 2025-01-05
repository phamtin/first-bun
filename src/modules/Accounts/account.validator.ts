import * as v from "valibot";
import type { InferInput } from "valibot";
import { stringObjectId } from "@/types/common.type";

import { SigninMethod, Theme, vAccountProfile } from "../../database/model/account/account.model";

export const updateProfileRequest = v.strictObject({
	signinMethod: v.optional(v.enum(SigninMethod)),
	profileInfo: v.optional(
		v.strictObject({
			email: v.optional(v.pipe(v.string(), v.trim(), v.email())),
			fullname: v.optional(v.string()),
			firstname: v.optional(v.string()),
			lastname: v.optional(v.string()),
			phoneNumber: v.optional(v.array(v.string())),
			birthday: v.optional(v.string()),
			locale: v.optional(v.string()),
			avatar: v.optional(v.string()),
			isPrivateAccount: v.optional(v.boolean()),
		})
	),
	accountSettings: v.optional(
		v.strictObject({
			theme: v.optional(v.enum(Theme)),
		})
	),
});

export const getMyProfileResponse = vAccountProfile;

export const getAccountProfileRequest = v.strictObject({
	accountId: v.optional(stringObjectId),
	email: v.optional(v.pipe(v.string(), v.trim(), v.email())),
});

export const getAccountProfileResponse = v.nullable(vAccountProfile);

export type GetMyProfileResponse = InferInput<typeof getMyProfileResponse>;
export type UpdateProfileRequest = InferInput<typeof updateProfileRequest>;
export type GetAccountProfileRequest = InferInput<typeof getAccountProfileRequest>;
export type GetAccountProfileResponse = InferInput<typeof getAccountProfileResponse>;
