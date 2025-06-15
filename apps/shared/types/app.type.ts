import type { JWTPayload } from "hono/utils/jwt/types";

export type JwtDecoded = {
	accountId: string;
};

export type UserCheckParser = {
	_id: string;
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
