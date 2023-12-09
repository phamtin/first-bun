import { t, Static } from "elysia";
import { ObjectId } from "mongodb";

import { AttributePattern, attributePattern } from "../../types/common.type";

//  week | day | hour
export const timeFrame = t.Enum({
	W: "W",
	w: "w",
	D: "D",
	d: "d",
	H: "H",
	h: "h",
});

export const dateTimeString = t.TemplateLiteral(`${t.Number() || ""}${t.Number()}${timeFrame}.${t.Number()}${t.Number()}${timeFrame}`); //  2d.4h

export const taskTiming = t.Object({
	startDate: t.Optional(t.Date()),
	endDate: t.Optional(t.Date()),
	estimation: t.Optional(dateTimeString),
});

export const taskStatus = t.Enum({
	NotStartYet: "NotStartYet",
	InProgress: "InProgress",
	Pending: "Pending",
	Done: "Done",
	Archived: "Archived",
});

export const specializedCareer = t.Enum({
	CustomerService: "CustomerService",
	Designer: "Designer",
	FinancialAccounting: "FinancialAccounting",
	InformationTechnology: "InformationTechnology",
	Management: "Management",
	Marketing: "Marketing",
	Hospitality: "Hospitality",
});

export const taskPriority = t.Enum({
	Critical: "Critical",
	High: "High",
	Medium: "Medium",
	Low: "Low",
});

export type TimeFrame = Static<typeof timeFrame>;
export type TaskStatus = Static<typeof taskStatus>;
export type TaskTiming = Static<typeof taskTiming>;
export type TaskPriority = Static<typeof taskPriority>;
export type DateTimeString = Static<typeof dateTimeString>;
export type SpecializedCareer = Static<typeof specializedCareer>;

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
	ownerId: ObjectId;
	description?: string;
	timing?: TaskTiming;
	priority?: TaskPriority;
	additionalInfo?: AttributePattern[];

	createdAt: Date;
	updatedAt: Date;
};

export const taskModel = t.Object({
	_id: t.String(),

	title: t.String(),
	ownerId: t.String(),
	status: taskStatus,
	priority: t.Optional(taskPriority),
	timing: t.Optional(taskTiming),
	description: t.Optional(t.String()),
	additionalInfo: t.Optional(t.Array(attributePattern)),

	createdAt: t.Date(),
	updatedAt: t.Date(),
});
