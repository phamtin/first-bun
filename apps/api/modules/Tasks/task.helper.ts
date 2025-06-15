import { randomUUIDv7 } from "bun";
import { type TaskActivity, TaskStatus, type TaskModel } from "@/shared/database/model/task/task.model";
import { toObjectId } from "@/shared/services/mongodb/helper";
import type { Context, UserCheckParser } from "@/shared/types/app.type";
import type { AttributePattern } from "@/shared/types/common.type";
import dayjs from "dayjs";
import { type NotificationModel, NotificationType } from "@/shared/database/model/notification/notification.model";
import NotificationSrv from "../Notification";

const EXCLUDED_TASK_STATUS: Record<TaskStatus, boolean> = {
	[TaskStatus.Archived]: true,
	[TaskStatus.NotStartYet]: false,
	[TaskStatus.InProgress]: false,
	[TaskStatus.Done]: false,
	[TaskStatus.Pending]: false,
};

const buildActivities = (account: UserCheckParser, payload: Partial<TaskModel>, model: TaskModel): TaskActivity[] => {
	if (!payload) return [];
	const aa = performance.now();

	const res: TaskActivity[] = [];
	const now = dayjs().toDate();
	const accountInfo: TaskActivity["account"] = { _id: toObjectId(account._id), profileInfo: account };
	const baseChangeItem: Omit<TaskActivity, "fieldChange"> = {
		account: accountInfo,
		action: "updated",
		updatedAt: now,
		changeGroupId: randomUUIDv7(),
	};

	if (payload.title) {
		if (payload.title !== model.title) {
			res.push({
				...baseChangeItem,
				fieldChange: {
					field: "title",
					oldValue: model.title,
					newValue: payload.title,
				},
			});
		}
	}

	if (payload.description) {
		if (payload.description !== model.description) {
			res.push({
				...baseChangeItem,
				action: model.description ? "updated" : "added",
				fieldChange: {
					field: "description",
					oldValue: model.description,
					newValue: payload.description,
				},
			});
		}
	} else if (payload.description === "" || payload.description === null) {
		if (model.description) {
			res.push({
				...baseChangeItem,
				action: "removed",
				fieldChange: {
					field: "description",
					oldValue: model.description,
					newValue: "",
				},
			});
		}
	}

	if (payload.priority) {
		if (payload.priority !== model.priority) {
			res.push({
				...baseChangeItem,
				fieldChange: {
					field: "priority",
					oldValue: model.priority,
					newValue: payload.priority,
				},
			});
		}
	}

	if (payload.status) {
		if (payload.status !== model.status) {
			res.push({
				...baseChangeItem,
				fieldChange: {
					field: "status",
					oldValue: model.status,
					newValue: payload.status,
				},
			});
		}
	}

	if (payload.assigneeInfo) {
		const assigneePayloadIds = payload.assigneeInfo.map((a) => a._id);
		const assigneeModelIds = model.assigneeInfo?.map((a) => a._id) || [];

		let hasChanged = false;

		if (assigneePayloadIds.length !== assigneeModelIds.length) {
			hasChanged = true;
		} else {
			for (let i = 0; i < assigneePayloadIds.length; i++) {
				const element = assigneePayloadIds[i];
				if (assigneeModelIds.indexOf(element) === -1) {
					hasChanged = true;
					break;
				}
			}
		}

		if (hasChanged) {
			res.push({
				...baseChangeItem,
				fieldChange: {
					field: "assigneeInfo",
					oldValue: model.assigneeInfo,
					newValue: payload.assigneeInfo,
				},
			});
		}
	}

	if (payload.additionalInfo) {
		const additionalPayloads: Readonly<AttributePattern[]> = payload.additionalInfo;
		const additionalModels: Readonly<AttributePattern[]> = model.additionalInfo || [];

		const additionalPayloadKeys = additionalPayloads.map((a) => a.k);
		const additionalModelsKeys = additionalModels.map((a) => a.k);

		/**
		 * 	Case add item
		 */
		const newItems: TaskModel["additionalInfo"] = [];

		for (let i = 0; i < additionalPayloadKeys.length; i++) {
			const payloadKey = additionalPayloadKeys[i];
			if (additionalModelsKeys.indexOf(payloadKey) === -1) {
				newItems.push(additionalPayloads[i]);
			}
		}
		if (newItems.length > 0) {
			res.push({
				...baseChangeItem,
				action: "added",
				fieldChange: {
					field: "additionalInfo",
					oldValue: undefined,
					newValue: newItems,
				},
			});
		}

		/**
		 * 	Case remove item
		 */
		const removedItems: TaskModel["additionalInfo"] = [];

		for (let i = 0; i < additionalModelsKeys.length; i++) {
			const modelKey = additionalModelsKeys[i];
			if (additionalPayloadKeys.indexOf(modelKey) === -1) {
				removedItems.push(additionalModels[i]);
			}
		}
		if (removedItems.length > 0) {
			res.push({
				...baseChangeItem,
				action: "removed",
				fieldChange: {
					field: "additionalInfo",
					oldValue: removedItems,
					newValue: [],
				},
			});
		}

		/**
		 * 	Case update item - keep the keys, but change the values
		 */
		const updatedItems: TaskModel["additionalInfo"] = [];
		const beforeUpdateItems: TaskModel["additionalInfo"] = [];

		for (let i = 0; i < additionalModels.length; i++) {
			const additionalModel = additionalModels[i];
			const payload = additionalPayloads.find((a) => a.k === additionalModel.k);
			if (payload) {
				if (payload.v !== additionalModel.v) {
					beforeUpdateItems.push(additionalModel);
					updatedItems.push(payload);
				}
			}
		}
		if (updatedItems.length > 0) {
			res.push({
				...baseChangeItem,
				fieldChange: {
					field: "additionalInfo",
					oldValue: beforeUpdateItems,
					newValue: updatedItems,
				},
			});
		}
	}

	if (payload.tags) {
		/**
		 * 	Case add item
		 */
		const modelTags = model.tags?.map((tag) => tag.toHexString()) || [];

		const newItems: TaskModel["tags"] = [];

		for (let i = 0; i < payload.tags.length; i++) {
			const payloadTag = payload.tags[i];

			if (!modelTags.includes(payloadTag.toHexString())) {
				newItems.push(payloadTag);
			}
		}
		if (newItems.length > 0) {
			res.push({
				...baseChangeItem,
				action: "added",
				fieldChange: {
					field: "tags",
					oldValue: undefined,
					newValue: newItems,
				},
			});
		}

		/**
		 * 	Case remove item
		 */
		const removedItems: TaskModel["tags"] = [];

		for (let i = 0; i < modelTags.length; i++) {
			const tag = modelTags[i];
			if (!payload.tags?.map((tag) => tag.toHexString()).includes(tag)) {
				removedItems.push(toObjectId(tag));
			}
		}
		if (removedItems.length > 0) {
			res.push({
				...baseChangeItem,
				action: "removed",
				fieldChange: {
					field: "tags",
					oldValue: removedItems,
					newValue: [],
				},
			});
		}
	}

	if (payload.timing) {
		const { startDate, endDate, estimation } = payload.timing;

		if (startDate) {
			if (dayjs(startDate).diff(model.timing?.startDate, "hour") > 0) {
				res.push({
					...baseChangeItem,
					fieldChange: {
						field: "startDate",
						oldValue: model.timing?.startDate || undefined,
						newValue: startDate,
					},
				});
			}
		} else if (startDate === null && model.timing?.startDate) {
			res.push({
				...baseChangeItem,
				action: "removed",
				fieldChange: {
					field: "startDate",
					oldValue: model.timing.startDate,
					newValue: null,
				},
			});
		}

		if (endDate) {
			if (dayjs(endDate).diff(model.timing?.endDate, "hour") > 0) {
				res.push({
					...baseChangeItem,
					fieldChange: {
						field: "endDate",
						oldValue: model.timing?.endDate || undefined,
						newValue: endDate,
					},
				});
			}
		} else if (endDate === null && model.timing?.endDate) {
			res.push({
				...baseChangeItem,
				action: "removed",
				fieldChange: {
					field: "endDate",
					oldValue: model.timing.endDate,
					newValue: null,
				},
			});
		}

		if (estimation) {
			if (model.timing?.estimation !== estimation) {
				res.push({
					...baseChangeItem,
					action: model.timing?.estimation ? "updated" : "added",
					fieldChange: {
						field: "estimation",
						oldValue: model.timing?.estimation || undefined,
						newValue: estimation,
					},
				});
			}
		} else if (estimation === null && model.timing?.estimation) {
			res.push({
				...baseChangeItem,
				action: "removed",
				fieldChange: {
					field: "estimation",
					oldValue: model.timing?.estimation || undefined,
					newValue: null,
				},
			});
		}
	}
	console.log("Duration buildActivities: ", performance.now() - aa);

	return res;
};

const checkCreateAssignedTaskNotification = async (ctx: Context, taskId: string, assignerId: string, assigneeId?: string) => {
	if (!assigneeId || assigneeId === ctx.user._id) {
		return false;
	}
	const DEBOUNCE_TIME = 60 * 60 * 1000; // 1 hour;
	const createdFrom = dayjs().subtract(DEBOUNCE_TIME, "ms").toISOString();
	const exists = (await NotificationSrv.getNotifications(ctx, { accountId: assigneeId, createdFrom })).filter((item) => {
		const n = item as NotificationModel<NotificationType.AssignedTaskForYou>;
		return (
			n.type === NotificationType.AssignedTaskForYou && n.payload.taskId === taskId && n.payload.assigneeId === assigneeId && n.payload.assignerId === assignerId
		);
	});
	return exists.length === 0;
};

export { EXCLUDED_TASK_STATUS, checkCreateAssignedTaskNotification, buildActivities };
