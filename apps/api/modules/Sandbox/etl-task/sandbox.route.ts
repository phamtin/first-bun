import { Hono } from "hono";
import { responseOK } from "@/shared/utils/response";
import SandboxSrv from "./sandbox.srv";
import { AppContext } from "@/shared/utils/transfrom";

const sandboxRoute = new Hono();

/**
 * 	Read CSV file
 */
sandboxRoute.post("/read-csv", async (c) => {
	const r = await SandboxSrv.readCsvFile(AppContext(c), []);
	return responseOK(c, r);
});

/**
 * 	Bulk create tasks
 */
sandboxRoute.post("/bulk-create", async (c) => {
	const r = await SandboxSrv.bulkCreateTask(AppContext(c), []);
	return responseOK(c, r);
});

export default sandboxRoute;
