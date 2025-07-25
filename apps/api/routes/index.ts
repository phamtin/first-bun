import { Hono } from "hono";
import { tokenParser } from "../middlewares/auth.parser";
import { creadentialParser } from "../middlewares/credential.parser";
import accountRoute from "../modules/Accounts/account.route";
import authRoute from "../modules/Auth/auth.route";
import folderRoute from "../modules/Folder/folder.route";
// import sandboxRoute from "../modules/Sandbox/etl-task/sandbox.route";
import notificationRoute from "../modules/Notification/noti.route";
import pomodoroRoute from "../modules/Pomodoro/pomodoro.route";
import taskRoute from "../modules/Tasks/task.route";

const routes = new Hono();

routes.get("/ping", (c) => {
	console.log("It works like a fking charm! - 1.0.0");

	return c.json({ pong: "It works like a fking charm! - 1.0.0" });
});

routes.use(creadentialParser);

routes.use(tokenParser);

routes.route("/auth", authRoute);

routes.route("/accounts", accountRoute);

routes.route("/tasks", taskRoute);

routes.route("/folders", folderRoute);

routes.route("/notifications", notificationRoute);

routes.route("/pomodoros", pomodoroRoute);

// routes.route("/sandbox", sandboxRoute);

export default routes;
