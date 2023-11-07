import { Static, t } from "elysia";
import { ObjectId } from "mongodb";

export const colorTheme = t.Enum({
	Light: "Light",
	Dark: "Dark",
	Device: "Device",
});

export const locale = t.Enum({
	Vi: "Vi",
	En: "En",
});

export const accountSetting = t.Object({
	theme: colorTheme,
	isPrivateAccount: t.Boolean(),
});

export const profileInfo = t.Object({
	locale: locale,
	phoneNumber: t.Optional(t.Array(t.String())),
	birthday: t.Optional(t.Date()),
});

export const signinMethod = t.Enum({
	Google: "Google",
	Apple: "Apple",
});

export type Locale = Static<typeof locale>;
export type ColorTheme = Static<typeof colorTheme>;
export type ProfileInfo = Static<typeof profileInfo>;
export type SigninMethod = Static<typeof signinMethod>;
export type AccountSetting = Static<typeof accountSetting>;

/**
 *  -----------------------------
 *	|
 * 	| Mongo Model - Account
 *	|
 * 	-----------------------------
 */
export type AccountModel = {
	_id: ObjectId;
	email: string;
	fullname: string;
	firstname: string;
	lastname: string;
	avatar: string;

	profileInfo: ProfileInfo;
	signinMethod: SigninMethod;
	accountSetting: AccountSetting;

	createdAt: Date;
	updatedAt: Date;
	deletedAt?: Date;
	isDeleted?: boolean;
};

export const accountModel = t.Object({
	_id: t.String(),

	email: t.String(),
	fullname: t.String(),
	firstname: t.String(),
	lastname: t.String(),
	avatar: t.String(),

	profileInfo: profileInfo,
	signinMethod: signinMethod,
	accountSetting: accountSetting,

	createdAt: t.Date(),
	updatedAt: t.Optional(t.Date()),
	isDeleted: t.Optional(t.Boolean()),
	deletedAt: t.Optional(t.Date()),
});
