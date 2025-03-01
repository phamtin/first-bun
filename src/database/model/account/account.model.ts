import { objectId } from "@/types/common.type";
import type { ObjectId } from "mongodb";
import * as v from "valibot";

export enum SigninMethod {
	Google = "Google",
	Telegram = "Telegram",
}

export enum Theme {
	Light = "Light",
	Dark = "Dark",
}

export type ProfileInfo = {
	email: string;
	fullname: string;
	firstname: string;
	lastname: string;
	phoneNumber: string[];
	locale: string;
	avatar: string;
	isPrivateAccount: boolean;
	birthday?: Date;
};

export type AccountSettings = {
	theme: Theme;
	pinnedProjects: ObjectId[];
};

/**
 * =============================
 *
 *  Account Model
 *
 * =============================
 */
export type AccountModel = {
	_id: ObjectId;

	profileInfo: ProfileInfo;
	signinMethod: SigninMethod;
	accountSettings: AccountSettings;

	createdAt: Date;
	updatedAt?: Date;
	createdBy?: ObjectId;
	deletedAt?: Date;
	deletedBy?: ObjectId;
};

/**
 * =============================
 *
 *  Account Validation Schema
 *
 * =============================
 */

export const vAccountProfile = v.strictObject({
	_id: objectId,
	signinMethod: v.enum(SigninMethod),
	profileInfo: v.strictObject({
		email: v.pipe(v.string(), v.email(), v.trim(), v.toLowerCase()),
		fullname: v.string(),
		firstname: v.string(),
		lastname: v.string(),
		phoneNumber: v.array(v.string()),
		birthday: v.optional(v.date()),
		locale: v.string(),
		avatar: v.string(),
		isPrivateAccount: v.boolean(),
	}),
	accountSettings: v.strictObject({
		theme: v.enum(Theme),
		pinnedProjects: v.array(objectId),
	}),

	createdAt: v.date(),
	createdBy: v.optional(objectId),
	updatedAt: v.optional(v.date()),
	deletedAt: v.optional(v.date()),
	deletedBy: v.optional(objectId),
}) satisfies v.BaseSchema<AccountModel, AccountModel, v.BaseIssue<unknown>>;
