import * as v from "valibot";
import type { InferInput } from "valibot";
import { vAccountProfile } from "@/shared/database/model/account/account.model";

export const LoginGoogleRequestSchema = v.strictObject({
	email: v.pipe(v.string(), v.email(), v.trim(), v.toLowerCase()),
	username: v.pipe(v.string(), v.trim(), v.minLength(4)),
	firstname: v.pipe(v.string(), v.trim(), v.minLength(1)),
	lastname: v.pipe(v.string(), v.trim(), v.minLength(2)),
	avatar: v.pipe(v.optional(v.string())),
});

export const LoginGoogleResponseSchema = v.strictObject({
	jwt: v.string(),
	...vAccountProfile.entries,
});

export type LoginGoogleRequest = InferInput<typeof LoginGoogleRequestSchema>;
export type LoginGoogleResponse = InferInput<typeof LoginGoogleResponseSchema>;
