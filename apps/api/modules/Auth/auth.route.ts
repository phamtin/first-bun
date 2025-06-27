import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { getValidationErrorMsg } from "@/shared/utils/error";
import { responseOK } from "@/shared/utils/response";
import { AppContext } from "@/shared/utils/transfrom";
import AuthSrv from "./auth.srv";
import { LoginGoogleRequestSchema } from "./auth.validator";

const authRoute = new Hono();

authRoute.post(
	"/signin/google",
	vValidator("json", LoginGoogleRequestSchema, (result) => {
		if (!result.success) {
			throw new HTTPException(400, { message: getValidationErrorMsg(result.issues) });
		}
	}),
	async (c) => {
		const r = await AuthSrv.signinWithGoogle(AppContext(c), c.req.valid("json"));
		const { _id, profileInfo } = r;
		c.set("user" as any, {
			_id,
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

authRoute.post("/logout", async (c) => {
	const r = await AuthSrv.logout(AppContext(c));
	return responseOK(c, r);
});

export default authRoute;
