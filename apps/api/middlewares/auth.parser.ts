import { verify } from "hono/jwt";
import { responseError } from "@/shared/utils/response";
import AccountCache from "@/shared/services/redis/account";
import type { UserCheckParser } from "../../shared/types/app.type";
import { createMiddleware } from "hono/factory";
import { AppError } from "@/shared/utils/error";
import AccountSrv from "@/api/modules/Accounts/account.srv";
import type { JWTPayload } from "hono/utils/jwt/types";
import { AppContext } from "@/shared/utils/transfrom";

export const tokenParser = createMiddleware(async (c, next) => {
	let token = "";
	const authorization = c.req.header("authorization");

	let user: UserCheckParser = {
		_id: "",
		email: "",
		firstname: "",
		lastname: "",
		username: "",
		avatar: "",
		phoneNumber: "",
		locale: "",
		isPrivateAccount: false,
	};

	if (authorization?.startsWith("Bearer")) {
		token = authorization.split(" ")[1];
	}
	if (c.req.url.includes("/auth/signin/google")) {
		await next();
	}
	if (c.req.url.includes("/admin/queues")) {
		await next();
	}
	if (!token) {
		return responseError(c, "UNAUTHORIZED", "Unauthorized");
	}

	try {
		const decoded = await verify(token, Bun.env.JWT_SECRET as string);

		const [session, account] = await Promise.all([
			AccountCache.getAccountSessionById(decoded.accountId as string, token),
			AccountSrv.findAccountProfile(AppContext(c), { accountId: decoded.accountId as string }),
		]);

		if (!session || !account) throw new AppError("UNAUTHORIZED", "Session's expired");

		c.set("jwtPayload", decoded satisfies JWTPayload);

		user = {
			_id: decoded.accountId as string,
			email: session.email,
			username: session.username,
			firstname: session.firstname,
			lastname: session.lastname,
			avatar: account.profileInfo.avatar,
			phoneNumber: session.phoneNumber,
			locale: session.locale,
			isPrivateAccount: session.isPrivateAccount,
		};
		console.log("[Redis:session] accountId: ", session._id);
	} catch (e) {
		console.log("[ERROR] auth.parser", e);
		c.set("user", {
			_id: "",
			email: "",
			firstname: "",
			lastname: "",
			username: "",
			avatar: "",
			phoneNumber: "",
			locale: "",
			isPrivateAccount: false,
		});

		return responseError(c, "UNAUTHORIZED", "Unauthorized. Invalid token");
	}

	c.set("user", user satisfies UserCheckParser);

	await next();
});
