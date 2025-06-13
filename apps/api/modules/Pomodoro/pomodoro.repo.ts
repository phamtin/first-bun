import type { UpdateFilter, WithoutId } from "mongodb";

import { AppError } from "@/shared/utils/error";
import type { Context } from "hono";
import { toObjectId } from "@/shared/services/mongodb/helper";
import type { PomodoroSession, PomodoroModel } from "@/shared/database/model/pomodoro/pomodoro.model";
import { PomodoroColl } from "@/shared/loaders/mongo";
import type * as pv from "./pomodoro.validator";
import type { Filter } from "mongodb";
import dayjs from "dayjs";

const findPomodoros = async (ctx: Context, request: pv.GetPomodorosRequest): Promise<PomodoroModel[]> => {
	const query: Filter<PomodoroModel> = {
		accountId: toObjectId(ctx.get("user")._id),
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
		};
	} else if (request.taskId) {
		updateQuery.taskId = toObjectId(request.taskId);
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
