import { verify } from "hono/jwt";
import { ObjectId } from "mongodb";

import type { UserCheckParser } from "@/types/app.type";
import { AccountColl, TokenColl } from "../loaders/mongo";
import { createMiddleware } from "hono/factory";
import { responseError } from "@/utils/response";
import { toObjectId } from "@/pkgs/mongodb/helper";

export const tokenParser = createMiddleware(async (c, next) => {
	let token = "";
	const authorization = c.req.header("authorization");

	let user: UserCheckParser = { _id: "", email: "", firstname: "", lastname: "", fullname: "" };

	if (authorization?.startsWith("Bearer")) {
		token = authorization.split(" ")[1];
	}

	if (c.req.url.includes("/auth/signout")) {
		await next();
	}
	if (c.req.url.includes("/auth/signin/google")) {
		await next();
	}
	if (!token) {
		return responseError(c, "UNAUTHORIZED", "Unauthorized");
	}

	try {
		const decoded = await verify(token, Bun.env.JWT_SECRET);

		const [currentUser, storedToken] = await Promise.all([
			AccountColl.findOne({
				_id: toObjectId(decoded.accountId as string),
			}),
			TokenColl.findOne({ value: token }),
		]);

		if (!currentUser?._id || !storedToken?.isPrimary) {
			return responseError(c, "FORBIDDEN", "Hack CC");
		}
		user = {
			_id: decoded.accountId as string,
			email: currentUser.profileInfo.email,
			fullname: currentUser.profileInfo.fullname,
			firstname: currentUser.profileInfo.firstname,
			lastname: currentUser.profileInfo.lastname,
		};
	} catch (e) {
		c.set("user", { _id: "", email: "", firstname: "", lastname: "", fullname: "" });

		return responseError(c, "UNAUTHORIZED", "Unauthorized");
	}

	c.set("user", user);

	await next();
});
