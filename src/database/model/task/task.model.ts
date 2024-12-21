import type { ObjectId } from "mongodb";

import type { AttributePattern } from "../../../types/common.type";
import type { AccountModel } from "../account/account.model";

//  week | day | hour
export enum TimeFrame {
	W = "W",
	w = "w",
	D = "D",
	d = "d",
	H = "H",
	h = "h",
}

export type DateTimeString = `${number | ""}${number}${TimeFrame}.${number}${number}${TimeFrame}`;

export type TaskTiming = {
	startDate?: Date;
	endDate?: Date;
	estimation?: DateTimeString;
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
	assigneeId?: ObjectId;
	description?: string;
	timing?: TaskTiming;
	priority?: TaskPriority;
	additionalInfo?: AttributePattern[];
	subTasks?: Pick<TaskModel, "title" | "status" | "description" | "priority" | "additionalInfo">[];

	createdAt: Date;
	updatedAt?: Date;
	createdBy?: ObjectId;
	deletedAt?: Date;
	deletedBy?: ObjectId;
};

export type ExtendTaskModel = {
	assignee?: AccountModel;
	hasAttachment?: boolean;
	created?: AccountModel;
};
