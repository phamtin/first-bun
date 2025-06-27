import dayjs from "dayjs";
import type { Filter, UpdateFilter, WithoutId } from "mongodb";
import type { PomodoroModel, PomodoroSession } from "@/shared/database/model/pomodoro/pomodoro.model";
import { PomodoroColl } from "@/shared/loaders/mongo";
import { toObjectId } from "@/shared/services/mongodb/helper";
import type { Context } from "@/shared/types/app.type";
import { AppError } from "@/shared/utils/error";
import FolderSrv from "../Folder/folder.srv";
import TaskSrv from "../Tasks/task.srv";
import type * as pv from "./pomodoro.validator";

const findPomodoros = async (ctx: Context, request: pv.GetPomodorosRequest): Promise<PomodoroModel[]> => {
	const query: Filter<PomodoroModel> = {
		accountId: toObjectId(ctx.user._id),
	};

	if (request.durationType) {
		query.durationType = request.durationType;
	}
	if (request.status) {
		query.status = request.status;
	}
	if (request.taskIds) {
		query.taskId = {
			$in: request.taskIds.map((id) => toObjectId(id)),
		};
	}

	return PomodoroColl.find(query).toArray();
};

const findById = async (ctx: Context, folderId: string): Promise<PomodoroModel | null> => {
	return PomodoroColl.findOne({ _id: toObjectId(folderId) });
};

const createPomodoro = async (ctx: Context, payload: WithoutId<PomodoroModel>): Promise<PomodoroModel | null> => {
	const data: WithoutId<PomodoroModel> = payload;

	const insertedId = await PomodoroColl.insertOne(data);

	if (!insertedId.acknowledged) throw new AppError("INTERNAL_SERVER_ERROR", "Fail to create pomodoro");

	return {
		...data,
		_id: insertedId.insertedId,
	};
};

const updatePomodoroSession = async (ctx: Context, pomodoroId: string, payload: PomodoroSession[]): Promise<PomodoroModel | null> => {
	const updated = await PomodoroColl.findOneAndUpdate(
		{
			_id: toObjectId(pomodoroId),
		},
		{
			$set: {
				pomodoroSessions: payload,
				updatedAt: dayjs().toDate(),
			},
		},
		{
			returnDocument: "after",
		},
	);

	if (!updated) throw new AppError("INTERNAL_SERVER_ERROR", "Fail to update pomodoro");

	return updated;
};

const updatePomodoro = async (ctx: Context, pomodoroId: string, request: pv.UpdatePomodoroRequest): Promise<PomodoroModel | null> => {
	let unsetTaskId: Record<string, true> = {};

	const updateQuery: UpdateFilter<WithoutId<PomodoroModel>> = {
		updatedAt: dayjs().toDate(),
	};

	if (request.taskId === null) {
		unsetTaskId = {
			taskId: true,
			folderId: true,
		};
	} else if (request.taskId) {
		updateQuery.taskId = toObjectId(request.taskId);
		const [createdFolders, sharedFolders, task] = await Promise.all([
			FolderSrv.getFoldersCreatedByMe(ctx, {}),
			FolderSrv.getFoldersSharedWithMe(ctx, {}),
			TaskSrv.findById(ctx, { id: request.taskId }),
		]);
		const folderId = createdFolders.concat(sharedFolders).find((f) => f._id.equals(task.folderId));

		if (!folderId) throw new AppError("NOT_FOUND", "Folder not found");

		updateQuery.folderId = folderId._id;
	}

	const updated = await PomodoroColl.findOneAndUpdate(
		{
			_id: toObjectId(pomodoroId),
		},
		{
			$set: updateQuery,
			$unset: unsetTaskId,
		},
		{
			ignoreUndefined: true,
			returnDocument: "after",
		},
	);

	if (!updated) throw new AppError("INTERNAL_SERVER_ERROR", "Fail to update pomodoro.");

	return updated;
};

const PomodoroRepo = {
	findPomodoros,
	findById,
	createPomodoro,
	updatePomodoro,
	updatePomodoroSession,
};

export default PomodoroRepo;
