import { verify } from "hono/jwt";
import { responseError } from "@/shared/utils/response";
import AccountCache from "@/shared/services/redis/account";
import type { UserCheckParser } from "../../shared/types/app.type";

import { createMiddleware } from "hono/factory";

export const tokenParser = createMiddleware(async (c, next) => {
	let token = "";
	const authorization = c.req.header("authorization");

	let user: UserCheckParser = { _id: "", email: "", firstname: "", lastname: "", fullname: "" };

	if (authorization?.startsWith("Bearer")) {
		token = authorization.split(" ")[1];
	}
	if (c.req.url.includes("/auth/logout")) {
		await next();
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

		const session = await AccountCache.getAccountSessionById(decoded.accountId as string, token);

		if (session) {
			user = {
				_id: decoded.accountId as string,
				email: session.email,
				fullname: session.fullname,
				firstname: session.firstname,
				lastname: session.lastname,
			};
			console.log("-- Session from Redis");
		} else {
			throw new Error("Session not found");
			// const [_currentUser, _storedToken] = await Promise.all([
			// 	AccountColl.findOne({
			// 		_id: toObjectId(decoded.accountId as string),
			// 	}),
			// 	TokenColl.findOne({ value: token, expiredAt: { $gt: dayjs().toDate() } }),
			// ]);

			// if (!_currentUser?._id || !_storedToken?.isPrimary) {
			// 	return responseError(c, "FORBIDDEN", "Hack CC?");
			// }
			// user = {
			// 	_id: decoded.accountId as string,
			// 	email: _currentUser.profileInfo.email,
			// 	fullname: _currentUser.profileInfo.fullname,
			// 	firstname: _currentUser.profileInfo.firstname,
			// 	lastname: _currentUser.profileInfo.lastname,
			// };
			// console.log("-- Session from MongoDb - weird!");
		}
	} catch (e) {
		console.log("[ERROR] auth.parser", e);
		c.set("user", { _id: "", email: "", firstname: "", lastname: "", fullname: "" });

		return responseError(c, "UNAUTHORIZED", "Unauthorized. Invalid token");
	}

	c.set("user", user satisfies UserCheckParser);

	await next();
});
