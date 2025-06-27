import { createMiddleware } from "hono/factory";
import { AccountStatus } from "@/shared/database/model/account/account.model";
import type { UserCheckParser } from "../../shared/types/app.type";
import { responseError } from "../../shared/utils/response";

export const isAuthenticated = createMiddleware(async (c, next) => {
	if (!(c.get("user") as UserCheckParser)?._id) {
		return responseError(c, "UNAUTHORIZED", "Hack CC");
	}

	await next();
});

export const isActiveAccount = createMiddleware(async (c, next) => {
	if ((c.get("user") as UserCheckParser)?.status !== AccountStatus.Active) {
		return responseError(c, "UNAUTHORIZED", "Account was deactivated");
	}

	await next();
});
