import { Hono } from "hono";

import authRoute from "../modules/Auth/auth.route";
import accountRoute from "../modules/Accounts/account.route";
import { tokenParser } from "../middlewares/auth.parser";
import taskRoute from "../modules/Tasks/task.route";
import folderRoute from "../modules/Folder/folder.route";
import pomodoroRoute from "../modules/Pomodoro/pomodoro.route";
import { creadentialParser } from "../middlewares/credential.parser";
import sandboxRoute from "../modules/Sandbox/sandbox.route";

const routes = new Hono();

routes.get("/ping", (c) => {
	console.log("It works like a fking charm! - 1.0.0-4");

	return c.json({ pong: "It works like a fking charm! - 1.0.0-4" });
});

routes.use(creadentialParser);

routes.use(tokenParser);

routes.route("/auth", authRoute);

routes.route("/accounts", accountRoute);

routes.route("/tasks", taskRoute);

routes.route("/folders", folderRoute);

routes.route("/pomodoros", pomodoroRoute);

routes.route("/sandbox", sandboxRoute);

export default routes;
