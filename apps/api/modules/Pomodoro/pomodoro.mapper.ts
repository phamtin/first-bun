import type { WithoutId } from "mongodb";
import { DurationType, type PomodoroModel, PomodoroStatus } from "@/shared/database/model/pomodoro/pomodoro.model";
import { toObjectId } from "@/shared/services/mongodb/helper";
import type { Context } from "@/shared/types/app.type";
import dayjs from "@/shared/utils/dayjs";
import { AppError } from "@/shared/utils/error";
import FolderSrv from "../Folder/folder.srv";
import TaskSrv from "../Tasks/task.srv";
import type { CreatePomodoroRequest } from "./pomodoro.validator";

export const buildPayloadCreate = async (ctx: Context, request: CreatePomodoroRequest) => {
	const accountId = toObjectId(ctx.user._id);

	const res: WithoutId<PomodoroModel> = {
		accountId,
		durationWork: request.durationWork,
		durationBreak: request.durationBreak,
		createdAt: dayjs().toDate(),
		pomodoroSessions: [],
	};

	if (request.taskId) {
		res.taskId = toObjectId(request.taskId);

		const [createdFolders, sharedFolders, task] = await Promise.all([
			FolderSrv.getFoldersCreatedByMe(ctx, {}),
			FolderSrv.getFoldersSharedWithMe(ctx, {}),
			TaskSrv.findById(ctx, { id: request.taskId }),
		]);

		const folderId = createdFolders.concat(sharedFolders).find((f) => f._id.equals(task.folderId));

		if (!folderId) throw new AppError("NOT_FOUND", "Folder not found");

		res.folderId = folderId._id;
	}

	for (let i = 0; i < request.numOfSession; i++) {
		res.pomodoroSessions.push({
			index: i,
			durationType: DurationType.Work,
			status: PomodoroStatus.NotStartYet,
		});
	}

	return res;
};
