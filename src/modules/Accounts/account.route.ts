import { Hono } from "hono";
import AccountSrv from "@/modules/Accounts";
import { responseOK } from "@/utils/response";
import { vValidator } from "@hono/valibot-validator";
import { updateProfileRequest } from "./account.validator";
import { HTTPException } from "hono/http-exception";
import { getValidationErrorMsg } from "@/utils/error";

const accountRoute = new Hono();

/**
 *  Get user profile
 */
accountRoute.get("/profile", async (c) => {
	const r = await AccountSrv.getMyProfile(c);
	return responseOK(c, r);
});

/**
 *  Update user profile
 */
accountRoute.patch(
	"/profile",
	vValidator("json", updateProfileRequest, (result) => {
		if (!result.success) {
			throw new HTTPException(400, { message: getValidationErrorMsg(result.issues) });
		}
	}),
	async (c) => {
		const r = await AccountSrv.updateProfile(c, c.req.valid("json"));
		return responseOK(c, r);
	}
);

export default accountRoute;
