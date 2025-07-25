import type { ObjectId } from "mongodb";
import * as v from "valibot";
import { objectId } from "../../../types/common.type";

export enum DurationType {
	Work = "Work",
	Break = "Break",
}

export enum PomodoroStatus {
	NotStartYet = "NotStartYet",
	Inprogress = "Inprogress",
	Completed = "Completed",
	Paused = "Paused",
	Cancelled = "Cancelled",
}

export type PomodoroSession = {
	index: number;
	durationType: DurationType;
	status: PomodoroStatus;
	pausedAt?: number;
};

/**
 * =============================
 *
 *  Pomodoro Model
 *
 * =============================
 */
export type PomodoroModel = {
	_id: ObjectId;

	accountId: ObjectId;
	durationWork: number;
	durationBreak: number;
	pomodoroSessions: PomodoroSession[];
	taskId?: ObjectId;
	folderId?: ObjectId;

	createdAt: Date;
	updatedAt?: Date;
	createdBy?: ObjectId;
	deletedAt?: Date;
	deletedBy?: ObjectId;
};

/**
 * =============================
 *
 *  Pomodoro Validation Schema
 *
 * =============================
 */

const vPomodoroSession = v.strictObject({
	index: v.number(),
	durationType: v.enum(DurationType),
	status: v.enum(PomodoroStatus),
	pausedAt: v.optional(v.number()),
});

export const vPomodoro = v.strictObject({
	_id: objectId,

	accountId: objectId,
	durationWork: v.number(),
	durationBreak: v.number(),
	pomodoroSessions: v.array(vPomodoroSession),
	taskId: v.optional(objectId),
	folderId: v.optional(objectId),

	createdAt: v.date(),
	createdBy: v.optional(objectId),
	updatedAt: v.optional(v.date()),
	deletedAt: v.optional(v.date()),
	deletedBy: v.optional(objectId),
}) satisfies v.BaseSchema<PomodoroModel, PomodoroModel, v.BaseIssue<unknown>>;
