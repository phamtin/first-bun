import type { CreatePomodoroRequest } from "./pomodoro.validator";
import { DurationType, PomodoroStatus, type PomodoroModel } from "@/shared/database/model/pomodoro/pomodoro.model";
import { toObjectId } from "@/shared/services/mongodb/helper";
import type { Context } from "hono";
import type { WithoutId } from "mongodb";
import dayjs from "@/shared/utils/dayjs";

export const buildPayloadCreate = (ctx: Context, request: CreatePomodoroRequest) => {
	const accountId = toObjectId(ctx.get("user")._id);

	const res: WithoutId<PomodoroModel> = {
		accountId,
		durationWork: request.durationWork,
		durationBreak: request.durationBreak,
		createdAt: dayjs().toDate(),
		pomodoroSessions: [],
	};

	if (request.taskId) {
		res.taskId = toObjectId(request.taskId);
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
