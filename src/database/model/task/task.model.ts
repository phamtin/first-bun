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
	description?: string;
	priority?: TaskPriority;
	assigneeInfo?: Omit<AccountModel, "accountSettings">[];
	additionalInfo?: AttributePattern[];
	timing?: TaskTiming;
	subTasks?: SubTask[];

	createdAt: Date;
	createdBy?: ObjectId;
	updatedAt?: Date;
	deletedAt?: Date;
	deletedBy?: ObjectId;
};

export type ExtendTaskModel = {
	hasAttachment?: boolean;
	created?: Omit<AccountModel, "accountSettings">;
};

export type SubTask = Pick<TaskModel, "title" | "status" | "description" | "priority" | "additionalInfo">;

/**
 *  -----------------------------
 *	|
 * 	| Validation Schema
 *	|
 * 	-----------------------------
 */

export const vSubTask = v.strictObject({
	title: v.string(),
	status: v.enum(TaskStatus),
	description: v.optional(v.string()),
	priority: v.optional(v.enum(TaskPriority)),
	additionalInfo: v.optional(v.array(vAttributePattern)),
}) satisfies v.BaseSchema<SubTask, SubTask, v.BaseIssue<unknown>>;

export const vExtendTaskModel = v.strictObject({
	hasAttachment: v.optional(v.boolean()),
	created: v.optional(v.omit(vAccountProfile, ["accountSettings"])),
}) satisfies v.BaseSchema<ExtendTaskModel, ExtendTaskModel, v.BaseIssue<unknown>>;

export const vTaskModel = v.strictObject({
	_id: objectId,
	title: v.string(),
	status: v.enum(TaskStatus),
	assigneeInfo: v.optional(v.array(v.omit(vAccountProfile, ["accountSettings"]))),
	description: v.optional(v.string()),
	timing: v.optional(
		v.strictObject({
			startDate: v.optional(v.date()),
			endDate: v.optional(v.date()),
			estimation: v.optional(v.string()),
		})
	),
	subTasks: v.optional(v.array(vSubTask)),
	priority: v.optional(v.enum(TaskPriority)),
	additionalInfo: v.optional(v.array(vAttributePattern)),

	createdAt: v.date(),
	createdBy: v.optional(objectId),
	updatedAt: v.optional(v.date()),
	deletedAt: v.optional(v.date()),
	deletedBy: v.optional(objectId),
}) satisfies v.BaseSchema<TaskModel, TaskModel, v.BaseIssue<unknown>>;
