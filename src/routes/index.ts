import Elysia from "elysia";
import AuthApp from "@/modules/Auth";
import TaskApp from "@/modules/Tasks";
import AccountApp from "@/modules/Accounts";
import {signinGoogleRequest, signoutGoogleRequest} from "@/modules/Auth/auth.validator";
import {createTaskRequest} from "@/modules/Tasks/task.validator";
import {isAuthenticated} from "@/middlewares/auth";
import {Context} from "@/types/app.type";
import {updateProfileRequest} from "@/modules/Accounts/account.validator";
import TagApp from "@/modules/Tags";
import {createTagRequest} from "@/modules/Tags/tag.validator";

const WithAppRouter = (app: Elysia): Elysia => {
	return app.group("/v1", (app) =>
		app
			.get("/", () => "Using v1")

			.group("/auth", (app) =>
				app
					.post("/signin/google", (c) => AuthApp.signinWithGoogle(c.store as Context, c.body), {
						body: signinGoogleRequest,
					})
					.post("/signout", (c) => AuthApp.logout(c.store as Context, c.body), {
						body: signoutGoogleRequest,
					})
			)

			.group("/accounts", (app) =>
				app
					.use(isAuthenticated)
					.get("/tasks", (c) => AccountApp.getMyTasks(c.store as Context, c.query))
					.get("/profile", (c) => AccountApp.getProfile(c.store as Context))
					.patch("/profile", (c) => AccountApp.updateProfile(c.store as Context, c.body), {
						body: updateProfileRequest,
					})
			)

			.group("/tasks", (app) =>
				app
					.use(isAuthenticated)
					.get("/:id", (c) => TaskApp.TaskSrv.getTask(c.store as Context))
					.post("/create", (c) => TaskApp.TaskSrv.createTask(c.store as Context, c.body), {
						body: createTaskRequest,
					})
					.patch("/:id", (c) => TaskApp.TaskSrv.updateTask(c.store as Context, c.body))
					.post("/sync-external-to-redis", (c) => TaskApp.TaskSrv.syncExternalToRedis(c.store as Context, c.body))
					.post("/sync-redis-to-db", (c) => TaskApp.TaskSrv.syncTaskToDb(c.store as Context, c.body))
			)

			.group("/tags", (app) =>
				app
					.use(isAuthenticated)
					.post("/create", (c) => TagApp.TagSrv.createTag(c.store as Context, c.body), {
						body: createTagRequest
					}))
	);
};

export default WithAppRouter;
