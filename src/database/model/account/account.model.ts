import type { ObjectId } from "mongodb";

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
	birthday?: Date;
};

export type AccountSettings = {
	theme: Theme;
	isPrivateAccount: boolean;
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
