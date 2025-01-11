import { Hono } from "hono";
import { vValidator } from "@hono/valibot-validator";
import { HTTPException } from "hono/http-exception";
import { responseOK } from "@/utils/response";
import { createTaskRequest, type GetMyTasksRequest, getMyTasksRequest, updateTaskRequest } from "@/modules/Tasks/task.validator";
import TaskSrv from "@/modules/Tasks/task.srv";
import { getValidationErrorMsg } from "@/utils/error";

const taskRoute = new Hono();

/**
 * 	Create a Task
 */
taskRoute.post(
	"/create",
	vValidator("json", createTaskRequest, (result, c) => {
		if (!result.success) {
			throw new HTTPException(400, { message: getValidationErrorMsg(result.issues) });
		}
	}),
	async (c) => {
		const r = await TaskSrv.createTask(c, c.req.valid("json"));
		return responseOK(c, r);
	}
);

/**
 * 	Get a list of my tasks
 */
taskRoute.get(
	"/my-tasks",
	vValidator("query", getMyTasksRequest, (result, c) => {
		if (!result.success) {
			throw new HTTPException(400, { message: getValidationErrorMsg(result.issues) });
		}
	}),
	async (c) => {
		const r = await TaskSrv.getMyTasks(c, c.req.valid("query") as GetMyTasksRequest);
		return responseOK(c, r);
	}
);

/**
 * 	Get task detail by task ID
 */
taskRoute.get("/:id", async (c) => {
	if (!c.req.param("id")) {
		throw new HTTPException(400, { message: "Task ID is required" });
	}
	const r = await TaskSrv.getTaskById(c, c.req.param("id"));
	return responseOK(c, r);
});

/**
 * 	Update a task by task ID
 */
taskRoute.patch(
	"/:id",
	vValidator("json", updateTaskRequest, (result, c) => {
		if (!result.success) {
			throw new HTTPException(400, { message: getValidationErrorMsg(result.issues) });
		}
	}),
	async (c) => {
		if (!c.req.param("id")) {
			throw new HTTPException(400, { message: "Task ID is required" });
		}
		const r = await TaskSrv.updateTask(c, c.req.param("id"), c.req.valid("json"));
		return responseOK(c, r);
	}
);

/**
 * 	Delete a task by task ID
 */
taskRoute.delete("/:id", async (c) => {
	if (!c.req.param("id")) {
		throw new HTTPException(400, { message: "Task ID is required" });
	}
	const r = await TaskSrv.deleteTask(c, c.req.param("id"));
	return responseOK(c, r);
});

export default taskRoute;
