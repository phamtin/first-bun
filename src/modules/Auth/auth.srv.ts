import dayjs from "dayjs";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import systemLog from "@/pkgs/systemLog";
import { AccountColl, TokenColl } from "@/loaders/mongo";
import { Value } from "@sinclair/typebox/value";

import {
	SigninGoogleRequest,
	SigninGoogleResponse,
	SignoutGoogleRequest,
	SignoutGoogleResponse,
	signinGoogleResponse,
} from "./auth.validator";
import { AccountSetting, ProfileInfo, SigninMethod } from "../Accounts/account.model";
import { Context } from "@/types/app.type";
import AppError from "@/pkgs/appError/Error";

const signinWithGoogle = async (ctx: Context, request: SigninGoogleRequest): Promise<SigninGoogleResponse> => {
	systemLog.info("Sign in with Google - START");

	const res: SigninGoogleResponse = Value.Create(signinGoogleResponse);

	const { email, accessToken, fullname, firstname, lastname, locale, avatar = "" } = request;

	if (!email || !accessToken || !firstname) {
		throw new AppError("BAD_REQUEST");
	}

	const account = await AccountColl.findOne({ email });

	if (!account) {
		const now = new Date();
		const signinMethod: SigninMethod = "Google";
		const profileInfo: ProfileInfo = {
			locale: "Vi",
			phoneNumber: [],
		};
		const accountSetting: AccountSetting = {
			theme: "Light",
			isPrivateAccount: false,
		};
		const { acknowledged, insertedId } = await AccountColl.insertOne({
			_id: new ObjectId(),
			email,
			firstname,
			lastname,
			fullname,
			avatar,
			profileInfo,
			signinMethod,
			accountSetting,
			createdAt: now,
			updatedAt: now,
		});
		if (!acknowledged) throw new AppError("INTERNAL_SERVER_ERROR");

		res._id = insertedId.toHexString();
		res.email = email;
		res.avatar = avatar;
		res.firstname = firstname;
		res.fullname = fullname;
		res.lastname = lastname;
		res.profileInfo = profileInfo;
		res.accountSetting = accountSetting;
		res.signinMethod = "Google";
	} else {
		res._id = account._id.toHexString();
		res.email = account.email;
		res.avatar = account.avatar;
		res.firstname = account.firstname;
		res.fullname = account.fullname;
		res.lastname = account.lastname;
		res.profileInfo = account.profileInfo;
		res.accountSetting = account.accountSetting;
		res.signinMethod = "Google";
	}

	const jwt = await generateAuthTokens(account?._id.toHexString() ?? res._id);
	res.jwt = jwt;

	systemLog.info("Sign in with Google - END");

	return res;
};

const generateAuthTokens = async (userId: string) => {
	const accessToken = signToken(userId);
	const accessTokenExpires = dayjs().add(+Bun.env.ACCESS_TOKEN_EXPIRE_MINUTE, "minute").toDate(); // 6 minutes
	await saveToken(accessToken, userId, accessTokenExpires);

	return {
		token: accessToken,
		expiredAt: accessTokenExpires,
	};
};

const signToken = (accountId: string): string => {
	const payload = {
		accountId: accountId,
		iat: new Date().getTime(),
	};
	return jwt.sign(payload, Bun.env.JWT_SECRET, {
		expiresIn: "6 minutes", // 6 minutes
	});
};

const saveToken = async (token: string, accountId: string, expiredAt: Date) => {
	const tokenDoc = await TokenColl.insertOne({
		isPrimary: true,
		userId: new ObjectId(accountId),
		token,
		expiredAt: expiredAt,
		createdAt: new Date(),
	});
	return tokenDoc;
};

const logout = async (ctx: Context, payload: SignoutGoogleRequest): Promise<SignoutGoogleResponse> => {
	await TokenColl.deleteMany({
		userId: new ObjectId(payload.userId),
	});

	ctx.user = {
		_id: "",
		email: "",
		firstname: "",
		lastname: "",
		fullname: "",
	};

	systemLog.info("logout - END");

	return true;
};

const AuthSrv = {
	signinWithGoogle,
	logout,
};

export default AuthSrv;
