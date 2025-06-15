import { Hono } from "hono";
import { AppContext } from "@/shared/utils/transfrom";
import AuthSrv from "./auth.srv";
import { vValidator } from "@hono/valibot-validator";
import { LoginGoogleRequestSchema } from "./auth.validator";
import { HTTPException } from "hono/http-exception";
import { responseOK } from "@/shared/utils/response";
import { getValidationErrorMsg } from "@/shared/utils/error";

const authRoute = new Hono();

authRoute.post(
	"/signin/google",
	vValidator("json", LoginGoogleRequestSchema, (result, c) => {
		if (!result.success) {
			throw new HTTPException(400, { message: getValidationErrorMsg(result.issues) });
		}
	}),
	async (c) => {
		const r = await AuthSrv.signinWithGoogle(AppContext(c), c.req.valid("json"));
		return responseOK(c, r);
	},
);

authRoute.post("/logout", async (c) => {
	const r = await AuthSrv.logout(AppContext(c));
	return responseOK(c, r);
});

export default authRoute;
