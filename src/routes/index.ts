import { Hono } from "hono";

import authRoute from "../modules/Auth/auth.route";
import accountRoute from "../modules/Accounts/account.route";
import { tokenParser } from "@/middlewares/auth.parser";
import taskRoute from "../modules/Tasks/task.route";
import projectRoute from "../modules/Project/project.route";
import { creadentialParser } from "@/middlewares/credential.parser";

const routes = new Hono();

routes.get("/ping", (c) => {
	return c.json({ pong: "It works like a fking charm! - 1.0.0-4" });
});

routes.use(creadentialParser);

routes.use(tokenParser);

routes.route("/auth", authRoute);

routes.route("/accounts", accountRoute);

routes.route("/tasks", taskRoute);

routes.route("/projects", projectRoute);

export default routes;
