import type { Context as HonoContext } from "hono";

export type JwtDecoded = {
	accountId: string;
};

export type UserCheckParser = {
	_id: string;
	email: string;
	username: string;
	firstname: string;
	lastname: string;
};

export type Context = HonoContext;
