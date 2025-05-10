import type { WithoutId } from "mongodb";
import dayjs from "@/shared/utils/dayjs";

import { AppError } from "@/shared/utils/error";
import type { Context } from "hono";
import { toObjectId } from "@/shared/services/mongodb/helper";
import type { PomodoroModel } from "@/shared/database/model/pomodoro/pomodoro.model";
import { PomodoroColl } from "@/shared/loaders/mongo";
import type { DeepPartial } from "@/shared/types/common.type";
import { toPayloadUpdate } from "@/shared/utils/transfrom";
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

	return await PomodoroColl.find(query).toArray();
};

const findById = async (ctx: Context, projectId: string): Promise<PomodoroModel | null> => {
	return await PomodoroColl.findOne({ _id: toObjectId(projectId) });
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

const updatePomodoro = async (ctx: Context, projectId: string, payload: DeepPartial<PomodoroModel>): Promise<PomodoroModel | null> => {
	const data = {
		...payload,
		updatedAt: dayjs().toDate(),
	};

	const updated = await PomodoroColl.findOneAndUpdate(
		{
			_id: toObjectId(projectId),
		},
		{
			$set: toPayloadUpdate(data),
		},
		{
			returnDocument: "after",
		},
	);

	if (!updated?._id) throw new AppError("INTERNAL_SERVER_ERROR", "Fail to update pomodoro");

	return updated;
};

const PomodoroRepo = {
	findPomodoros,
	findById,
	createPomodoro,
	updatePomodoro,
};

export default PomodoroRepo;
