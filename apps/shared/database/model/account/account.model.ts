import type { ObjectId } from "mongodb";
import * as v from "valibot";
import { objectId } from "../../../types/common.type";

export enum SigninMethod {
	Google = "Google",
	Telegram = "Telegram",
}

export enum Theme {
	Light = "Light",
	Dark = "Dark",
}

export enum AccountStatus {
	Active = "Active",
	Deactivated = "Deactivated",
	Deleted = "Deleted",
}

export type ProfileInfo = {
	status: AccountStatus;
	email: string;
	username: string;
	firstname: string;
	lastname: string;
	phoneNumber: string;
	locale: string;
	avatar: string;
	isPrivateAccount: boolean;
	birthday?: Date;
};

export type PomodoroSettings = { numOfSession: number; durationWork: number; durationBreak: number };

export type AccountSettings = {
	theme: Theme;
	pinnedFolderIds: ObjectId[];
	pomodoroSettings: PomodoroSettings;
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
	signupAt: Date;

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

export const vPomodoroSettings = v.strictObject({
	numOfSession: v.number(),
	durationWork: v.number(),
	durationBreak: v.number(),
}) satisfies v.BaseSchema<PomodoroSettings, PomodoroSettings, v.BaseIssue<unknown>>;

export const vAccountProfile = v.strictObject({
	_id: objectId,
	signinMethod: v.enum(SigninMethod),
	profileInfo: v.strictObject({
		status: v.enum(AccountStatus),
		email: v.pipe(v.string(), v.email(), v.trim(), v.toLowerCase()),
		username: v.string(),
		firstname: v.string(),
		lastname: v.string(),
		phoneNumber: v.string(),
		birthday: v.optional(v.date()),
		locale: v.string(),
		avatar: v.string(),
		isPrivateAccount: v.boolean(),
	}),
	accountSettings: v.strictObject({
		theme: v.enum(Theme),
		pinnedFolderIds: v.array(objectId),
		pomodoroSettings: vPomodoroSettings,
	}),
	signupAt: v.date(),

	createdAt: v.date(),
	createdBy: v.optional(objectId),
	updatedAt: v.optional(v.date()),
	deletedAt: v.optional(v.date()),
	deletedBy: v.optional(objectId),
}) satisfies v.BaseSchema<AccountModel, AccountModel, v.BaseIssue<unknown>>;
