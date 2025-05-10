import type { DeepPartial } from "@/shared/types/common.type";
import type { CreatePomodoroRequest, UpdatePomodoroRequest } from "./pomodoro.validator";
import { PomodoroStatus, type PomodoroModel } from "@/shared/database/model/pomodoro/pomodoro.model";
import { toObjectId } from "@/shared/services/mongodb/helper";
import type { Context } from "hono";
import type { WithoutId } from "mongodb";
import { DEFAULT_DURATION } from "./pomodoro.const";
import dayjs from "@/shared/utils/dayjs";

export const buildPayloadUpdate = (request: UpdatePomodoroRequest, model?: Readonly<PomodoroModel>): DeepPartial<PomodoroModel> | undefined => {
	let res: DeepPartial<PomodoroModel> | undefined = undefined;

	if (Object.keys(request).length === 0) return res;

	res = {} satisfies DeepPartial<PomodoroModel>;

	if (request.duration) {
		res.duration = request.duration;
	}
	if (request.durationType) {
		res.durationType = request.durationType;
	}
	if (request.status) {
		res.status = request.status;
	}

	return res;
};

export const buildPayloadCreate = (ctx: Context, request: CreatePomodoroRequest) => {
	let res: WithoutId<PomodoroModel> | undefined = undefined;

	const accountId = toObjectId(ctx.get("user")._id);

	res = {
		accountId,
		duration: DEFAULT_DURATION[request.durationType],
		durationType: request.durationType,
		status: PomodoroStatus.Active,
		createdBy: accountId,
		createdAt: dayjs().toDate(),
	};

	if (request.taskId) {
		res.taskId = toObjectId(request.taskId);
	}

	if (request.duration) {
		res.duration = request.duration;
	}

	return res;
};
