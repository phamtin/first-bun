import { Hono } from "hono";

import authRoute from "../modules/Auth/auth.route";
import accountRoute from "../modules/Accounts/account.route";
import { tokenParser } from "@/middlewares/auth.parser";
import taskRoute from "../modules/Tasks/task.route";

const routes = new Hono();

routes.use(tokenParser);

routes.route("/auth", authRoute);

routes.route("/accounts", accountRoute);

routes.route("/tasks", taskRoute);

export default routes;
