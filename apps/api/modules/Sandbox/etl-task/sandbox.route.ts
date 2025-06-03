import { Hono } from "hono";
import { vValidator } from "@hono/valibot-validator";
import { HTTPException } from "hono/http-exception";
import { responseOK } from "@/shared/utils/response";
import { getValidationErrorMsg } from "@/shared/utils/error";
import SandboxSrv from "./sandbox.srv";

const sandboxRoute = new Hono();

/**
 * 	Read CSV file
 */
sandboxRoute.post("/read-csv", async (c) => {
	const r = await SandboxSrv.readCsvFile(c, []);
	return responseOK(c, r);
});

/**
 * 	Bulk create tasks
 */
sandboxRoute.post("/bulk-create", async (c) => {
	const r = await SandboxSrv.bulkCreateTask(c, []);
	return responseOK(c, r);
});

export default sandboxRoute;
