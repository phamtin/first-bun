import type { MatchKeysAndValues, WithoutId } from "mongodb";

import { AppError } from "@/shared/utils/error";
import type { Context } from "hono";
import { toObjectId } from "@/shared/services/mongodb/helper";
import type { PomodoroModel } from "@/shared/database/model/pomodoro/pomodoro.model";
import { PomodoroColl } from "@/shared/loaders/mongo";
import type * as pv from "./pomodoro.validator";
import type { Filter } from "mongodb";

const findPomodoros = async (ctx: Context, request: pv.GetPomodorosRequest): Promise<PomodoroModel[]> => {
	const query: Filter<PomodoroModel> = {
		accountId: toObjectId(request.accountId),
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
	const data: WithoutId<PomodoroModel> = {
		...payload,
	};

	const insertedId = await PomodoroColl.insertOne(data);

	if (!insertedId.acknowledged) throw new AppError("INTERNAL_SERVER_ERROR", "Fail to create pomodoro");

	return {
		...data,
		_id: insertedId.insertedId,
	};
};

const updatePomodoroSession = async (ctx: Context, pomodoroId: string, request: pv.UpdatePomodoroRequest[]): Promise<PomodoroModel | null> => {
	const updateQuery: MatchKeysAndValues<WithoutId<PomodoroModel>> = {};

	//	This will update all sessions with the same status
	//	Apply for only this case: update session status
	updateQuery["pomodoroSessions.$[elem].status"] = request[0].status;

	const updated = await PomodoroColl.updateOne(
		{
			_id: toObjectId(pomodoroId),
		},
		{
			$set: updateQuery,
		},
		{ arrayFilters: [{ "elem.index": { $in: request.map((item) => item.sessionIndex) } }] },
	);

	if (!updated.acknowledged) throw new AppError("INTERNAL_SERVER_ERROR", "Fail to update pomodoro");

	return findById(ctx, pomodoroId);
};

const PomodoroRepo = {
	findPomodoros,
	findById,
	createPomodoro,
	updatePomodoroSession,
};

export default PomodoroRepo;
