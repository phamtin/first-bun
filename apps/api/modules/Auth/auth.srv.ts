import { OAuth2Client } from "google-auth-library";
import { sign } from "hono/jwt";
import type { JWTPayload } from "hono/utils/jwt/types";
import { ObjectId } from "mongodb";
import { type AccountSettings, AccountStatus, type ProfileInfo, SigninMethod, Theme } from "@/shared/database/model/account/account.model";
import { AccountColl, TokenColl } from "@/shared/loaders/mongo";
import { toObjectId } from "@/shared/services/mongodb/helper";
import AccountCache from "@/shared/services/redis/account";
import type { Context } from "@/shared/types/app.type";
import dayjs from "@/shared/utils/dayjs";
import { AppError } from "@/shared/utils/error";
import AccountSrv from "../Accounts";
import FolderSrv from "../Folder/folder.srv";
import { DEFAULT_DURATION } from "../Pomodoro/pomodoro.const";
import type { LoginGoogleRequest, LoginGoogleResponse } from "./auth.validator";

const oAuth2Client = new OAuth2Client({
	clientId: Bun.env.GOOGLE_CLIENT_ID,
	clientSecret: Bun.env.GOOGLE_CLIENT_SECRET,
	redirectUri: "http://localhost:5173/",
});

export const signinWithGoogle = async (ctx: Context, request: LoginGoogleRequest): Promise<LoginGoogleResponse> => {
	const { clientId, credential } = request;
	const now = dayjs().toDate();

	let res: LoginGoogleResponse = {
		_id: new ObjectId(),
		jwt: "",
		signinMethod: SigninMethod.Google,
		profileInfo: {
			status: AccountStatus.Active,
			email: "",
			username: "",
			firstname: "",
			lastname: "",
			phoneNumber: "",
			locale: "",
			avatar: "",
			isPrivateAccount: false,
		},
		accountSettings: {
			theme: Theme.Light,
			pinnedFolderIds: [],
			pomodoroSettings: {
				numOfSession: 4,
				durationWork: DEFAULT_DURATION.Work,
				durationBreak: DEFAULT_DURATION.Break,
			},
		},
		signupAt: now,
		createdAt: now,
	};

	const ticket = await oAuth2Client.verifyIdToken({ idToken: credential, audience: clientId });

	const payload = ticket.getPayload();

	if (!payload) throw new AppError("UNAUTHORIZED", "Failed to verify ID token");

	const { email, given_name, family_name, picture, iat, exp } = payload;

	if (!email || !given_name || !family_name || !picture || !iat || !exp) {
		throw new AppError("UNAUTHORIZED", "Failed to verify ID token");
	}
	const username = `${given_name} ${family_name}`;
	const firstname = given_name;
	const lastname = family_name;
	const avatar = picture;

	const account = await AccountColl.findOne({ "profileInfo.email": email });

	if (!account) {
		const status: AccountStatus = AccountStatus.Active;
		const signinMethod: SigninMethod = SigninMethod.Google;
		const profileInfo: ProfileInfo = {
			status,
			email,
			username,
			firstname,
			lastname,
			avatar,
			locale: "Vi",
			phoneNumber: "",
			isPrivateAccount: false,
		};
		const accountSettings: AccountSettings = {
			theme: Theme.Light,
			pinnedFolderIds: [],
			pomodoroSettings: {
				numOfSession: 4,
				durationWork: DEFAULT_DURATION.Work,
				durationBreak: DEFAULT_DURATION.Break,
			},
		};
		const { acknowledged, insertedId } = await AccountColl.insertOne({
			profileInfo,
			signinMethod,
			accountSettings,
			signupAt: now,
			createdAt: now,
			updatedAt: now,
		});

		if (!acknowledged) throw new AppError("INTERNAL_SERVER_ERROR", "Internal Server Error");

		try {
			const defaultFolder = await FolderSrv.createFolder(ctx, { title: `${firstname}'s Folder`, color: "#2fad64" }, true);
			await AccountSrv.updateProfile(ctx, {
				accountSettings: {
					pinnedFolderIds: [defaultFolder.folder._id.toHexString()],
				},
			});
		} catch {
			throw new AppError("INTERNAL_SERVER_ERROR", "Internal Server Error");
		}

		res._id = insertedId;
		res.signinMethod = signinMethod;
		res.profileInfo = profileInfo;
		res.accountSettings = accountSettings;
		res.signupAt = now;
		res.createdAt = now;
	} else {
		if (account.profileInfo.status !== AccountStatus.Active) {
			throw new AppError("UNAUTHORIZED", "Account was deactivated");
		}
		res = { ...account, jwt: "" };
	}

	res.jwt = await generateAuthTokens(res._id.toHexString());

	AccountCache.addAccountSession({ ...res.profileInfo, _id: res._id, token: res.jwt });

	return res;
};

const signToken = async (accountId: string) => {
	const payload: JWTPayload = {
		accountId,
		exp: dayjs()
			.add(+(Bun.env.ACCESS_TOKEN_EXPIRE_MINUTE as string), "minute")
			.unix(),
	};
	const res = await sign(payload, Bun.env.JWT_SECRET as string);

	return res;
};

const saveToken = async (value: string, accountId: string, expiredAt: Date) => {
	const [tokenDoc, _] = await Promise.all([
		TokenColl.insertOne({
			isPrimary: true,
			accountId: toObjectId(accountId),
			value,
			expiredAt: expiredAt,
			createdAt: new Date(),
		}),
		TokenColl.updateMany(
			{
				accountId: toObjectId(accountId),
				value: {
					$ne: value,
				},
			},
			{
				$set: {
					isPrimary: false,
				},
			},
		),
	]);
	return tokenDoc;
};

const generateAuthTokens = async (userId: string) => {
	const accessToken = await signToken(userId);
	const accessTokenExpires = dayjs()
		.add(+(Bun.env.ACCESS_TOKEN_EXPIRE_MINUTE as string), "minute")
		.toDate();
	await saveToken(accessToken, userId, accessTokenExpires);

	return accessToken;
};

const logout = async (ctx: Context): Promise<boolean> => {
	await TokenColl.deleteMany({
		accountId: toObjectId(ctx.user._id),
	});

	AccountCache.removeSessionByAccountId(ctx.user._id);

	return true;
};

const AuthSrv = {
	signinWithGoogle,
	logout,
};

export default AuthSrv;
