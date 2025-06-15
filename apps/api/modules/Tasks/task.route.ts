import * as v from "valibot";
import { Hono } from "hono";
import { vValidator } from "@hono/valibot-validator";
import { HTTPException } from "hono/http-exception";
import { responseOK } from "@/shared/utils/response";
import { createTaskRequest, findTaskByIdRequest, type GetTasksRequest, getTasksRequest, updateTaskRequest } from "./task.validator";
import TaskSrv from "./task.srv";
import { getValidationErrorMsg } from "@/shared/utils/error";
import { AppContext } from "@/shared/utils/transfrom";

const taskRoute = new Hono();

/**
 * 	Get a list of tasks
 */
taskRoute.get(
	"/",
	vValidator("query", getTasksRequest, (result, c) => {
		if (!result.success) {
			throw new HTTPException(400, { message: getValidationErrorMsg(result.issues) });
		}
	}),
	async (c) => {
		const r = await TaskSrv.getTasks(AppContext(c), c.req.valid("query") as GetTasksRequest);
		return responseOK(c, r);
	},
);

/**
 * 	Create a Task
 */
taskRoute.post(
	"/create",
	vValidator("json", createTaskRequest, (result) => {
		if (!result.success) {
			throw new HTTPException(400, { message: getValidationErrorMsg(result.issues) });
		}
	}),
	async (c) => {
		const r = await TaskSrv.createTask(AppContext(c), c.req.valid("json"));
		return responseOK(c, r);
	},
);

/**
 * 	Get task detail by task ID
 */
taskRoute.get(
	"/:id",
	vValidator("query", v.pick(findTaskByIdRequest, ["select"]), (result) => {
		if (!result.success) {
			throw new HTTPException(400, { message: getValidationErrorMsg(result.issues) });
		}
	}),
	async (c) => {
		const r = await TaskSrv.findById(AppContext(c), {
			id: c.req.param("id"),
			select: c.req.valid("query").select,
		});
		return responseOK(c, r);
	},
);

/**
 * 	Update a task by task ID
 */
taskRoute.patch(
	"/:id",
	vValidator("json", updateTaskRequest, (result) => {
		if (!result.success) {
			throw new HTTPException(400, { message: getValidationErrorMsg(result.issues) });
		}
	}),
	async (c) => {
		if (!c.req.param("id")) {
			throw new HTTPException(400, { message: "Task ID is required" });
		}
		const r = await TaskSrv.updateTask(AppContext(c), c.req.param("id"), c.req.valid("json"));
		return responseOK(c, r);
	},
);

/**
 * 	Delete a task by task ID
 */
taskRoute.delete("/:id", async (c) => {
	if (!c.req.param("id")) {
		throw new HTTPException(400, { message: "Task ID is required" });
	}
	const r = await TaskSrv.deleteTask(AppContext(c), c.req.param("id"));
	return responseOK(c, r);
});

export default taskRoute;
