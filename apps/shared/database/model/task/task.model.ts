import type { ObjectId } from "mongodb";
import * as v from "valibot";

import { objectId, vAttributePattern, type AttributePattern } from "../../../types/common.type";
import { vAccountProfile, type AccountModel } from "../account/account.model";

export type TaskTiming = {
	startDate?: Date;
	endDate?: Date;
	estimation?: string;
};

export enum TaskPriority {
	Critical = "Critical",
	High = "High",
	Medium = "Medium",
	Low = "Low",
}

export enum TaskStatus {
	NotStartYet = "NotStartYet",
	InProgress = "InProgress",
	Pending = "Pending",
	Done = "Done",
	Archived = "Archived",
}

/**
 *  -----------------------------
 *	|
 * 	| Mongo Model - Task
 *	|
 * 	-----------------------------
 */
export type TaskModel = {
	_id: ObjectId;

	title: string;
	status: TaskStatus;
	folderId: ObjectId;
	description?: string;
	priority?: TaskPriority;
	assigneeInfo?: Omit<AccountModel, "accountSettings">[];
	additionalInfo?: AttributePattern[];
	timing?: TaskTiming;
	subTasks?: SubTask[];
	tags?: ObjectId[];

	createdAt: Date;
	createdBy?: ObjectId;
	updatedAt?: Date;
	deletedAt?: Date;
	deletedBy?: ObjectId;
};

export type ExtendTaskModel = {
	created?: Omit<AccountModel, "accountSettings">;
	availableTags?: { _id: ObjectId; name: string; color: string }[];
};

export type SubTask = Pick<TaskModel, "_id" | "title" | "description" | "priority" | "additionalInfo"> & { status?: TaskStatus };

export type InlineTaskModel = Pick<TaskModel, "_id" | "folderId" | "title" | "status" | "timing" | "createdAt"> & {
	assigneeInfo?: { _id: ObjectId }[];
};

/**
 *  -----------------------------
 *	|
 * 	| Validation Schema
 *	|
 * 	-----------------------------
 */

export const vSubTask = v.strictObject({
	_id: objectId,
	title: v.string(),
	status: v.optional(v.enum(TaskStatus)),
	description: v.optional(v.string()),
	priority: v.optional(v.enum(TaskPriority)),
	additionalInfo: v.optional(v.array(vAttributePattern)),
}) satisfies v.BaseSchema<SubTask, SubTask, v.BaseIssue<unknown>>;

export const vExtendTaskModel = v.strictObject({
	created: v.optional(v.omit(vAccountProfile, ["accountSettings"])),
	availableTags: v.optional(
		v.array(
			v.strictObject({
				_id: objectId,
				name: v.string(),
				color: v.string(),
			}),
		),
	),
}) satisfies v.BaseSchema<ExtendTaskModel, ExtendTaskModel, v.BaseIssue<unknown>>;

export const vTaskModel = v.strictObject({
	_id: objectId,
	title: v.string(),
	status: v.enum(TaskStatus),
	folderId: objectId,
	assigneeInfo: v.optional(v.array(v.omit(vAccountProfile, ["accountSettings"]))),
	description: v.optional(v.string()),
	timing: v.optional(
		v.strictObject({
			startDate: v.optional(v.date()),
			endDate: v.optional(v.date()),
			estimation: v.optional(v.string()),
		}),
	),
	tags: v.optional(v.array(objectId)),
	subTasks: v.optional(v.array(vSubTask)),
	priority: v.optional(v.enum(TaskPriority)),
	additionalInfo: v.optional(v.array(vAttributePattern)),

	createdAt: v.date(),
	createdBy: v.optional(objectId),
	updatedAt: v.optional(v.date()),
	deletedAt: v.optional(v.date()),
	deletedBy: v.optional(objectId),
}) satisfies v.BaseSchema<TaskModel, TaskModel, v.BaseIssue<unknown>>;

export const vInlineTaskModel = v.strictObject({
	...v.pick(vTaskModel, ["_id", "folderId", "title", "status", "timing", "createdAt"]).entries,
	assigneeInfo: v.optional(v.array(v.pick(vAccountProfile, ["_id"]))),
});
