import * as v from "valibot";
import type { InferInput } from "valibot";
import { stringObjectId } from "@/shared/types/common.type";

import { Theme, vAccountProfile } from "@/shared/database/model/account/account.model";

export const updateProfileRequest = v.strictObject({
	profileInfo: v.optional(
		v.strictObject({
			email: v.optional(v.pipe(v.string(), v.email(), v.trim(), v.toLowerCase())),
			fullname: v.optional(v.string()),
			firstname: v.optional(v.string()),
			lastname: v.optional(v.string()),
			phoneNumber: v.optional(v.array(v.string())),
			birthday: v.optional(v.string()),
			avatar: v.optional(v.string()),
			isPrivateAccount: v.optional(v.boolean()),
		}),
	),
	accountSettings: v.optional(
		v.strictObject({
			theme: v.optional(v.enum(Theme)),
			pinnedProjects: v.optional(v.array(stringObjectId)),
		}),
	),
});

export const getMyProfileResponse = vAccountProfile;

export const getAccountProfileRequest = v.strictObject({
	accountId: v.optional(stringObjectId),
	email: v.optional(v.pipe(v.string(), v.email(), v.trim(), v.toLowerCase())),
});

export const getAccountProfileResponse = v.nullable(vAccountProfile);

export type GetMyProfileResponse = InferInput<typeof getMyProfileResponse>;
export type UpdateProfileRequest = InferInput<typeof updateProfileRequest>;
export type UpdateProfileResponse = InferInput<typeof getMyProfileResponse>;
export type GetAccountProfileRequest = InferInput<typeof getAccountProfileRequest>;
export type GetAccountProfileResponse = InferInput<typeof getAccountProfileResponse>;
