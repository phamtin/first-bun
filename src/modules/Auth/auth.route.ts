import { Hono } from "hono";
import AuthSrv from "./auth.srv";
import { vValidator } from "@hono/valibot-validator";
import { LoginGoogleRequestSchema } from "@/modules/Auth/auth.validator";
import { HTTPException } from "hono/http-exception";
import { responseOK } from "@/utils/response";
import { getValidationErrorMsg } from "@/utils/error";

const authRoute = new Hono();

authRoute.post(
	"/signin/google",
	vValidator("json", LoginGoogleRequestSchema, (result, c) => {
		if (!result.success) {
			throw new HTTPException(400, { message: getValidationErrorMsg(result.issues) });
		}
	}),
	async (c) => {
		const r = await AuthSrv.signinWithGoogle(c, c.req.valid("json"));
		return responseOK(c, r);
	},
);

authRoute.post("/logout", async (c) => {
	const r = await AuthSrv.logout(c);
	return responseOK(c, r);
});

export default authRoute;
