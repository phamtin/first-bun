import { Hono } from "hono";
import { vValidator } from "@hono/valibot-validator";
import { HTTPException } from "hono/http-exception";
import { responseOK } from "@/shared/utils/response";
import { createPomodoroRequest, getPomodorosRequest, updatePomodoroRequest } from "./pomodoro.validator";
import PomodoroSrv from "./pomodoro.srv";
import { getValidationErrorMsg } from "@/shared/utils/error";
import { AppContext } from "@/shared/utils/transfrom";

const pomodoroRoute = new Hono();

/**
 * 	Get Pomodoro sessions
 */
pomodoroRoute.get(
	"/",
	vValidator("query", getPomodorosRequest, (result) => {
		if (!result.success) {
			throw new HTTPException(400, { message: getValidationErrorMsg(result.issues) });
		}
	}),
	async (c) => {
		const r = await PomodoroSrv.getPomodoros(AppContext(c), c.req.valid("query"));
		return responseOK(c, r);
	},
);

/**
 * 	Create a Pomodoro session
 */
pomodoroRoute.post(
	"/create",
	vValidator("json", createPomodoroRequest, (result) => {
		if (!result.success) {
			throw new HTTPException(400, { message: getValidationErrorMsg(result.issues) });
		}
	}),
	async (c) => {
		const r = await PomodoroSrv.createPomodoro(AppContext(c), c.req.valid("json"));
		return responseOK(c, r);
	},
);

/**
 * 	Update a Pomodoro session
 */
pomodoroRoute.patch(
	"/:pomodoroId",
	vValidator("json", updatePomodoroRequest, (result) => {
		if (!result.success) {
			throw new HTTPException(400, { message: getValidationErrorMsg(result.issues) });
		}
	}),
	async (c) => {
		if (!c.req.param("pomodoroId")) {
			throw new HTTPException(400, { message: "Pomodoro ID is required" });
		}
		const r = await PomodoroSrv.updatePomodoro(AppContext(c), c.req.param("pomodoroId"), c.req.valid("json"));
		return responseOK(c, r);
	},
);

export default pomodoroRoute;
