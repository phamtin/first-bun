import * as v from "valibot";
import type { InferInput } from "valibot";
import { stringObjectId } from "@/shared/types/common.type";

import { Theme, vAccountProfile } from "@/shared/database/model/account/account.model";

export const updateProfileRequest = v.strictObject({
	profileInfo: v.optional(
		v.strictObject({
			email: v.optional(v.pipe(v.string(), v.email(), v.trim(), v.toLowerCase())),
			username: v.optional(v.string()),
			firstname: v.optional(v.string()),
			lastname: v.optional(v.string()),
			phoneNumber: v.optional(v.string()),
			birthday: v.optional(v.string()),
			avatar: v.optional(v.string()),
			isPrivateAccount: v.optional(v.boolean()),
		}),
	),
	accountSettings: v.optional(
		v.strictObject({
			theme: v.optional(v.enum(Theme)),
			pinnedFolders: v.optional(v.array(stringObjectId)),
			pomodoroSettings: v.optional(
				v.strictObject({
					numOfSession: v.optional(v.pipe(v.number(), v.minValue(1, "Must be at least 1 session"), v.maxValue(24, "Must be at most 24 sessions"))),
					durationWork: v.optional(
						v.pipe(v.number(), v.minValue(5, "Work duration must be at least 5 minutes"), v.maxValue(60, "Work duration must be at most 60 minutes")),
					),
					durationBreak: v.optional(
						v.pipe(v.number(), v.minValue(0.5, "Break duration must be at least 1/2 minute"), v.maxValue(60, "Break duration must be at most 60 minutes")),
					),
				}),
			),
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
export type UpdateProfileResponse = InferInput<typeof vAccountProfile>;
export type GetAccountProfileRequest = InferInput<typeof getAccountProfileRequest>;
export type GetAccountProfileResponse = InferInput<typeof getAccountProfileResponse>;
