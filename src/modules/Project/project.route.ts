import { Hono } from "hono";
import { vValidator } from "@hono/valibot-validator";
import { HTTPException } from "hono/http-exception";
import { responseOK } from "@/utils/response";
import { responseInvitationRequest, createProjectRequest, inviteRequest, updateProjectRequest, removeRequest } from "@/modules/Project/project.validator";
import ProjectSrv from "@/modules/Project/project.srv";
import { getValidationErrorMsg } from "@/utils/error";

const projectRoute = new Hono();

/**
 * 	Create a Project
 */
projectRoute.post(
	"/create",
	vValidator("json", createProjectRequest, (result, c) => {
		if (!result.success) {
			throw new HTTPException(400, { message: getValidationErrorMsg(result.issues) });
		}
	}),
	async (c) => {
		const r = await ProjectSrv.createProject(c, c.req.valid("json"));
		return responseOK(c, r);
	},
);

/**
 * 	Get a list of my projects
 */
projectRoute.get("/my-projects", async (c) => {
	const r = await ProjectSrv.getMyProjects(c);
	return responseOK(c, r);
});

/**
 * 	Get project detail by project ID
 */
projectRoute.get("/:id", async (c) => {
	if (!c.req.param("id")) {
		throw new HTTPException(400, { message: "Project ID is required" });
	}
	const r = await ProjectSrv.getProjectById(c, c.req.param("id"));
	return responseOK(c, r);
});

/**
 * 	Update a project by project ID
 */
projectRoute.patch(
	"/:id",
	vValidator("json", updateProjectRequest, (result, c) => {
		if (!result.success) {
			throw new HTTPException(400, { message: getValidationErrorMsg(result.issues) });
		}
	}),
	async (c) => {
		if (!c.req.param("id")) {
			throw new HTTPException(400, { message: "Project ID is required" });
		}
		const r = await ProjectSrv.updateProject(c, c.req.param("id"), c.req.valid("json"));
		return responseOK(c, r);
	},
);

/**
 * 	Delete a project by project ID
 */
projectRoute.delete("/:id", async (c) => {
	if (!c.req.param("id")) {
		throw new HTTPException(400, { message: "Project ID is required" });
	}
	const r = await ProjectSrv.deleteProject(c, c.req.param("id"));
	return responseOK(c, r);
});

/**
 *  Invite users join into a project
 */
projectRoute.post(
	"/invite",
	vValidator("json", inviteRequest, (result, c) => {
		if (!result.success) {
			throw new HTTPException(400, { message: getValidationErrorMsg(result.issues) });
		}
	}),
	async (c) => {
		const r = await ProjectSrv.invite(c, c.req.valid("json"));
		return responseOK(c, r);
	},
);

/**
 *  Accept a invitation join into a project
 */
projectRoute.post(
	"/invite/response",
	vValidator("json", responseInvitationRequest, (result, c) => {
		if (!result.success) {
			throw new HTTPException(400, { message: getValidationErrorMsg(result.issues) });
		}
	}),
	async (c) => {
		const r = await ProjectSrv.responseInvitation(c, c.req.valid("json"));
		return responseOK(c, r);
	},
);

/**
 *  Owner remove a member from a project
 */
projectRoute.post(
	"/invite/remove",
	vValidator("json", removeRequest, (result, c) => {
		if (!result.success) {
			throw new HTTPException(400, { message: getValidationErrorMsg(result.issues) });
		}
	}),
	async (c) => {
		const r = await ProjectSrv.removeMember(c, c.req.valid("json"));
		return responseOK(c, r);
	},
);

export default projectRoute;
