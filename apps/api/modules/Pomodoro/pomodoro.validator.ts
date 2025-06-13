import * as v from "valibot";
import type { InferInput } from "valibot";
import { DurationType, PomodoroStatus, vPomodoro } from "@/shared/database/model/pomodoro/pomodoro.model";
import { httpGETRequestParamArray, stringObjectId } from "@/shared/types/common.type";

export const getPomodorosRequest = v.strictObject({
	durationType: v.optional(v.enum(DurationType)),
	status: v.optional(v.enum(PomodoroStatus)),
	taskIds: v.optional(httpGETRequestParamArray(stringObjectId)),
});

export const getPomodorosResponse = v.array(vPomodoro);

export const createPomodoroRequest = v.strictObject({
	numOfSession: v.pipe(v.number(), v.minValue(1, "Must be at least 1 session"), v.maxValue(24, "Must be at most 24 sessions")),
	durationWork: v.pipe(v.number(), v.minValue(5, "Work duration must be at least 5 minutes"), v.maxValue(60, "Work duration must be at most 60 minutes")),
	durationBreak: v.pipe(v.number(), v.minValue(0.5, "Break duration must be at least 1/2 minute"), v.maxValue(60, "Break duration must be at most 60 minutes")),
	taskId: v.optional(stringObjectId),
});

export const createPomodoroResponse = vPomodoro;

export const updatePomodoroRequest = v.strictObject({
	sessionIndex: v.number(),
	status: v.optional(v.enum(PomodoroStatus)),
	pausedAt: v.optional(v.number()),
	taskId: v.optional(stringObjectId),
	isFinished: v.optional(v.union([v.literal("true"), v.literal("false")])),
});

export const updatePomodoroResponse = v.strictObject({
	...vPomodoro.entries,
});

export type GetPomodorosRequest = InferInput<typeof getPomodorosRequest>;
export type GetPomodorosResponse = InferInput<typeof getPomodorosResponse>;
export type CreatePomodoroRequest = InferInput<typeof createPomodoroRequest>;
export type CreatePomodoroResponse = InferInput<typeof createPomodoroResponse>;
export type UpdatePomodoroRequest = InferInput<typeof updatePomodoroRequest>;
export type UpdatePomodoroResponse = InferInput<typeof updatePomodoroResponse>;
