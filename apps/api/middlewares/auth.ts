import { createMiddleware } from "hono/factory";
import { responseError } from "../../shared/utils/response";

export const isAuthenticated = createMiddleware(async (c, next) => {
	const user = c.get("user");

	if (!user?._id) {
		return responseError(c, "UNAUTHORIZED", "Hack CC");
	}

	await next();
});
