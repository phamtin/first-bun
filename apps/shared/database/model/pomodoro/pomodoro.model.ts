import { objectId } from "../../../types/common.type";
import type { ObjectId } from "mongodb";
import * as v from "valibot";

export enum DurationType {
	Work = "Work",
	Break = "Break",
}

export enum PomodoroStatus {
	Active = "Active",
	Completed = "Completed",
	Paused = "Paused",
	Cancelled = "Cancelled",
}

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
	duration: number;
	durationType: DurationType;
	status: PomodoroStatus;
	taskId?: ObjectId;

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

export const vPomodoro = v.strictObject({
	_id: objectId,

	accountId: objectId,
	duration: v.number(),
	durationType: v.enum(DurationType),
	status: v.enum(PomodoroStatus),
	taskId: v.optional(objectId),

	createdAt: v.date(),
	createdBy: v.optional(objectId),
	updatedAt: v.optional(v.date()),
	deletedAt: v.optional(v.date()),
	deletedBy: v.optional(objectId),
}) satisfies v.BaseSchema<PomodoroModel, PomodoroModel, v.BaseIssue<unknown>>;
