import { t, Static } from "elysia";
import { accountSetting, profileInfo, signinMethod } from "../Accounts/account.model";

export const signinGoogleRequest = t.Object({
	email: t.String(),
	accessToken: t.String(),
	fullname: t.String(),
	firstname: t.String(),
	lastname: t.String(),
	avatar: t.String(),
	locale: t.Optional(t.String()),
});

export const signinGoogleResponse = t.Object({
	_id: t.String(),
	email: t.String(),
	fullname: t.String(),
	firstname: t.String(),
	lastname: t.String(),
	avatar: t.String(),
	jwt: t.Object({
		token: t.String(),
		expiredAt: t.Date(),
	}),
	profileInfo: profileInfo,
	accountSetting: accountSetting,
	signinMethod: signinMethod,
});

export const signoutGoogleRequest = t.Object({
	userId: t.String(),
});

export const signoutGoogleResponse = t.Boolean();

export type SignoutGoogleRequest = Static<typeof signoutGoogleRequest>;
export type SignoutGoogleResponse = Static<typeof signoutGoogleResponse>;
export type SigninGoogleRequest = Static<typeof signinGoogleRequest>;
export type SigninGoogleResponse = Static<typeof signinGoogleResponse>;
