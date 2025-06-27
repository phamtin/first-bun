import type { JWTPayload } from "hono/utils/jwt/types";
import type { AccountStatus } from "../database/model/account/account.model";

export type JwtDecoded = {
	accountId: string;
};

export type UserCheckParser = {
	_id: string;
	status: AccountStatus;
	email: string;
	username: string;
	firstname: string;
	lastname: string;
	avatar: string;
	phoneNumber: string;
	locale: string;
	isPrivateAccount: boolean;
};

export type Context = {
	jwtPayload: JWTPayload;
	user: UserCheckParser;
};
