import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { getValidationErrorMsg } from "@/shared/utils/error";
import { responseOK } from "@/shared/utils/response";
import { AppContext } from "@/shared/utils/transfrom";
import AccountSrv from "./account.srv";
import { getAccountProfileRequest, updateProfileRequest } from "./account.validator";

const accountRoute = new Hono();

/**
 *  Get user profile
 */
accountRoute.get("/profile", async (c) => {
	const r = await AccountSrv.getMyProfile(AppContext(c));
	return responseOK(c, r);
});

/**
 *  Find user profile by ID/Email
 */
accountRoute.get(
	"/search",
	vValidator("query", getAccountProfileRequest, (result) => {
		if (!result.success) {
			throw new HTTPException(400, { message: getValidationErrorMsg(result.issues) });
		}
	}),
	async (c) => {
		const r = await AccountSrv.findAccountProfile(AppContext(c), c.req.valid("query"));
		return responseOK(c, r);
	},
);

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
		const r = await AccountSrv.updateProfile(AppContext(c), c.req.valid("json"));
		const { profileInfo } = r;
		c.set("user" as any, {
			_id: r._id,
			email: profileInfo.email,
			username: profileInfo.username,
			firstname: profileInfo.firstname,
			lastname: profileInfo.lastname,
			avatar: profileInfo.avatar,
			phoneNumber: profileInfo.phoneNumber,
			locale: profileInfo.locale,
			isPrivateAccount: profileInfo.isPrivateAccount,
		});
		return responseOK(c, r);
	},
);

/**
 *  Deactivate account
 */
accountRoute.post("/deactivate", async (c) => {
	const r = await AccountSrv.deactivateAccount(AppContext(c));
	return responseOK(c, r);
});

export default accountRoute;
