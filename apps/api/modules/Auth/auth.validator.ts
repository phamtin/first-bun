import * as v from "valibot";
import type { InferInput } from "valibot";
import { vAccountProfile } from "@/shared/database/model/account/account.model";

export const LoginGoogleRequestSchema = v.strictObject({
	clientId: v.string(),
	credential: v.string(),
	selectBy: v.string(),
	isMobile: v.optional(v.boolean()),
});

export const LoginGoogleResponseSchema = v.strictObject({
	jwt: v.string(),
	...vAccountProfile.entries,
});

export type LoginGoogleRequest = InferInput<typeof LoginGoogleRequestSchema>;
export type LoginGoogleResponse = InferInput<typeof LoginGoogleResponseSchema>;
