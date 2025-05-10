import * as v from "valibot";
import type { InferInput } from "valibot";
import { DurationType, PomodoroStatus, vPomodoro } from "@/shared/database/model/pomodoro/pomodoro.model";
import { stringObjectId } from "@/shared/types/common.type";

export const getPomodorosRequest = v.strictObject({
	accountId: stringObjectId,
	durationType: v.optional(v.enum(DurationType)),
	status: v.optional(v.enum(PomodoroStatus)),
	taskIds: v.optional(v.array(stringObjectId)),
});

export const getPomodorosResponse = v.array(vPomodoro);

export const createPomodoroRequest = v.strictObject({
	duration: v.optional(v.number()),
	durationType: v.enum(DurationType),
	taskId: v.optional(stringObjectId),
});

export const createPomodoroResponse = v.strictObject({
	...vPomodoro.entries,
});

export const updatePomodoroRequest = v.strictObject({
	duration: v.optional(v.number()),
	durationType: v.optional(v.enum(DurationType)),
	status: v.optional(v.enum(PomodoroStatus)),
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
