import { randomUUIDv7 } from "bun";
import { type TaskActivity, TaskStatus, type TaskModel } from "@/shared/database/model/task/task.model";
import { toObjectId } from "@/shared/services/mongodb/helper";
import type { UserCheckParser } from "@/shared/types/app.type";
import type { AttributePattern } from "@/shared/types/common.type";
import dayjs from "dayjs";

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

	const activities: TaskActivity[] = [];

	const accountInfo: TaskActivity["account"] = { _id: toObjectId(account._id), profileInfo: account };

	const now = dayjs().toDate();

	const changeGroupId = randomUUIDv7();

	const baseChangeItem: Omit<TaskActivity, "fieldChange"> = {
		account: accountInfo,
		action: "updated",
		updatedAt: now,
		changeGroupId,
	};

	if (payload.title) {
		if (payload.title !== model.title) {
			activities.push({
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
			activities.push({
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
			activities.push({
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
			activities.push({
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
			activities.push({
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
			activities.push({
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
		activities.push({
			...baseChangeItem,
			action: "added",
			fieldChange: {
				field: "additionalInfo",
				oldValue: undefined,
				newValue: newItems,
			},
		});

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
			activities.push({
				...baseChangeItem,
				action: "removed",
				fieldChange: {
					field: "additionalInfo",
					oldValue: removedItems,
					newValue: undefined,
				},
			});
		}

		/**
		 * 	Case update item - keep the keys, but change the values
		 */
		const updatedItems: TaskModel["additionalInfo"] = [];
		const beforeUpdateItems: TaskModel["additionalInfo"] = [];

		for (let i = 0; i < additionalModels.length; i++) {
			const model = additionalModels[i];
			const payload = additionalPayloads.find((a) => a.k === model.k);
			if (payload) {
				if (payload.v !== model.v) {
					updatedItems.push(payload);
					beforeUpdateItems.push(model);
				}
			}
		}
		if (updatedItems.length > 0) {
			activities.push({
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
			activities.push({
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
			activities.push({
				...baseChangeItem,
				action: "removed",
				fieldChange: {
					field: "tags",
					oldValue: removedItems,
					newValue: undefined,
				},
			});
		}
	}

	if (payload.timing) {
		const { startDate, endDate, estimation } = payload.timing;

		if (startDate) {
			if (dayjs(startDate).diff(model.timing?.startDate, "hour") > 0) {
				activities.push({
					...baseChangeItem,
					fieldChange: {
						field: "startDate",
						oldValue: model.timing?.startDate || undefined,
						newValue: startDate,
					},
				});
			}
		} else if (startDate === null && model.timing?.startDate) {
			activities.push({
				...baseChangeItem,
				action: "removed",
				fieldChange: {
					field: "startDate",
					oldValue: model.timing.startDate,
					newValue: undefined,
				},
			});
		}

		if (endDate) {
			if (dayjs(endDate).diff(model.timing?.endDate, "hour") > 0) {
				activities.push({
					...baseChangeItem,
					fieldChange: {
						field: "endDate",
						oldValue: model.timing?.endDate || undefined,
						newValue: endDate,
					},
				});
			}
		} else if (endDate === null && model.timing?.endDate) {
			activities.push({
				...baseChangeItem,
				action: "removed",
				fieldChange: {
					field: "endDate",
					oldValue: model.timing.endDate,
					newValue: undefined,
				},
			});
		}

		if (estimation) {
			if (model.timing?.estimation !== estimation) {
				activities.push({
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
			activities.push({
				...baseChangeItem,
				action: "removed",
				fieldChange: {
					field: "estimation",
					oldValue: model.timing?.estimation || undefined,
					newValue: undefined,
				},
			});
		}
	}
	console.log("Duration buildActivities: ", performance.now() - aa);

	return activities;
};

export { EXCLUDED_TASK_STATUS, buildActivities };
