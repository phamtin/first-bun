import { Hono } from "hono";
import { vValidator } from "@hono/valibot-validator";
import { HTTPException } from "hono/http-exception";
import { responseOK } from "@/shared/utils/response";
import { responseInvitationRequest, createFolderRequest, inviteRequest, updateFolderRequest, removeRequest } from "./folder.validator";
import FolderSrv from "./folder.srv";
import { getValidationErrorMsg } from "@/shared/utils/error";

const folderRoute = new Hono();

/**
 * 	Create a Folder
 */
folderRoute.post(
	"/create",
	vValidator("json", createFolderRequest, (result, c) => {
		if (!result.success) {
			throw new HTTPException(400, { message: getValidationErrorMsg(result.issues) });
		}
	}),
	async (c) => {
		const r = await FolderSrv.createFolder(c, c.req.valid("json"));
		return responseOK(c, r);
	},
);

/**
 * 	Get a list of folders shared with me
 */
folderRoute.get("/shared-with-me", async (c) => {
	return responseOK(c, await FolderSrv.getFoldersSharedWithMe(c));
});

/**
 * 	Get a list of my folders
 */
folderRoute.get("/my-folders", async (c) => {
	const r = await FolderSrv.getMyFolders(c);
	return responseOK(c, r);
});

/**
 * 	Get folder detail by folder ID
 */
folderRoute.get("/:id", async (c) => {
	if (!c.req.param("id")) {
		throw new HTTPException(400, { message: "Folder ID is required" });
	}
	const r = await FolderSrv.getFolderById(c, c.req.param("id"));
	return responseOK(c, r);
});

/**
 * 	Update a folder by folder ID
 */
folderRoute.patch(
	"/:id",
	vValidator("json", updateFolderRequest, (result, c) => {
		if (!result.success) {
			throw new HTTPException(400, { message: getValidationErrorMsg(result.issues) });
		}
	}),
	async (c) => {
		if (!c.req.param("id")) {
			throw new HTTPException(400, { message: "Folder ID is required" });
		}
		const r = await FolderSrv.updateFolder(c, c.req.param("id"), c.req.valid("json"));
		return responseOK(c, r);
	},
);

/**
 * 	Delete a folder by folder ID
 */
folderRoute.delete("/:id", async (c) => {
	if (!c.req.param("id")) {
		throw new HTTPException(400, { message: "Folder ID is required" });
	}
	const r = await FolderSrv.deleteFolder(c, c.req.param("id"));
	return responseOK(c, r);
});

/**
 *  Invite users join into a folder
 */
folderRoute.post(
	"/invite",
	vValidator("json", inviteRequest, (result, c) => {
		if (!result.success) {
			throw new HTTPException(400, { message: getValidationErrorMsg(result.issues) });
		}
	}),
	async (c) => {
		const r = await FolderSrv.invite(c, c.req.valid("json"));
		return responseOK(c, r);
	},
);

/**
 *  Accept a invitation join into a folder
 */
folderRoute.post(
	"/invite/response",
	vValidator("json", responseInvitationRequest, (result, c) => {
		if (!result.success) {
			throw new HTTPException(400, { message: getValidationErrorMsg(result.issues) });
		}
	}),
	async (c) => {
		const r = await FolderSrv.responseInvitation(c, c.req.valid("json"));
		return responseOK(c, r);
	},
);

/**
 *  Owner remove a member from a folder
 */
folderRoute.post(
	"/invite/remove",
	vValidator("json", removeRequest, (result, c) => {
		if (!result.success) {
			throw new HTTPException(400, { message: getValidationErrorMsg(result.issues) });
		}
	}),
	async (c) => {
		const r = await FolderSrv.removeMember(c, c.req.valid("json"));
		return responseOK(c, r);
	},
);

export default folderRoute;
