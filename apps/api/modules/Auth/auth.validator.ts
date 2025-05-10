import * as v from "valibot";
import type { InferInput } from "valibot";

export const LoginGoogleRequestSchema = v.strictObject({
	email: v.pipe(v.string(), v.email(), v.trim(), v.toLowerCase()),
	fullname: v.pipe(v.string(), v.trim(), v.minLength(4)),
	firstname: v.pipe(v.string(), v.trim(), v.minLength(1)),
	lastname: v.pipe(v.string(), v.trim(), v.minLength(2)),
	avatar: v.pipe(v.optional(v.string())),
});

export const LoginGoogleResponseSchema = v.strictObject({
	_id: v.string(),
	jwt: v.string(),
	profileInfo: v.strictObject({
		avatar: v.string(),
		email: v.string(),
		fullname: v.string(),
		firstname: v.string(),
		lastname: v.string(),
		phoneNumber: v.array(v.string()),
		birthday: v.optional(v.date()),
		locale: v.string(),
		isPrivateAccount: v.boolean(),
	}),
	accountSettings: v.strictObject({
		theme: v.string(),
	}),
});

export type LoginGoogleRequest = InferInput<typeof LoginGoogleRequestSchema>;
export type LoginGoogleResponse = InferInput<typeof LoginGoogleResponseSchema>;
