import { sign } from "hono/jwt";
import dayjs from "@/utils/dayjs";
import { AccountColl, TokenColl } from "@/loaders/mongo";

import type { LoginGoogleRequest, LoginGoogleResponse } from "./auth.validator";
import { type AccountSettings, type ProfileInfo, SigninMethod, Theme } from "../../database/model/account/account.model";
import type { JWTPayload } from "hono/utils/jwt/types";
import type { Context } from "@/types/app.type";
import { AppError } from "@/utils/error";
import { toObjectId, toStringId } from "@/pkgs/mongodb/helper";

const signinWithGoogle = async (ctx: Context, request: LoginGoogleRequest): Promise<LoginGoogleResponse> => {
	const res: LoginGoogleResponse = {
		_id: "",
		jwt: "",
		profileInfo: {
			email: "",
			fullname: "",
			firstname: "",
			lastname: "",
			phoneNumber: [],
			locale: "",
			avatar: "",
			isPrivateAccount: false,
		},
		accountSettings: {
			theme: "Light",
		},
	};

	const { email, fullname, firstname, lastname, avatar = "" } = request;

	const account = await AccountColl.findOne({ "profileInfo.email": email });

	if (!account) {
		const now = new Date();
		const signinMethod: SigninMethod = SigninMethod.Google;
		const profileInfo: ProfileInfo = {
			email,
			fullname,
			firstname,
			lastname,
			avatar,
			locale: "Vi",
			phoneNumber: [],
			isPrivateAccount: false,
		};
		const accountSettings: AccountSettings = {
			theme: Theme.Light,
		};
		const { acknowledged, insertedId } = await AccountColl.insertOne({
			profileInfo,
			signinMethod,
			accountSettings,
			createdAt: now,
			updatedAt: now,
		});

		if (!acknowledged) throw new AppError("INTERNAL_SERVER_ERROR", "Internal Server Error");

		res._id = toStringId(insertedId);
		res.profileInfo = profileInfo;
		res.accountSettings = accountSettings;
	} else {
		res._id = toStringId(account._id);
		res.profileInfo = account.profileInfo;
		res.accountSettings = account.accountSettings;
	}

	res.jwt = await generateAuthTokens(res._id);

	return res;
};

const signToken = async (accountId: string) => {
	const payload: JWTPayload = {
		accountId,
		exp: dayjs().add(+Bun.env.ACCESS_TOKEN_EXPIRE_MINUTE, "minute").unix(),
	};
	const res = await sign(payload, Bun.env.JWT_SECRET);

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
			}
		),
	]);
	return tokenDoc;
};

const generateAuthTokens = async (userId: string) => {
	const accessToken = await signToken(userId);
	const accessTokenExpires = dayjs().add(+Bun.env.ACCESS_TOKEN_EXPIRE_MINUTE, "minute").toDate(); // 5 minutes
	await saveToken(accessToken, userId, accessTokenExpires);

	return accessToken;
};

const logout = async (ctx: Context): Promise<boolean> => {
	await TokenColl.deleteMany({
		accountId: toObjectId(ctx.get("user")._id),
	});

	ctx.set("user", { _id: "", email: "", firstname: "", lastname: "", fullname: "" });

	return true;
};

const AuthSrv = {
	signinWithGoogle,
	logout,
};

export default AuthSrv;
