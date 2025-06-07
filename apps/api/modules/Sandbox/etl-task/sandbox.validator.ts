import * as v from "valibot";
import type { InferInput } from "valibot";
import { createTaskRequest } from "../../Tasks/task.validator";
import { vTaskModel } from "@/shared/database/model/task/task.model";
import { coercedArray } from "@/shared/types/common.type";

export const bulkCreateTaskRequest = v.strictObject({
	tasks: coercedArray(createTaskRequest),
});

export const bulkCreateTaskResponse = coercedArray(vTaskModel);

export type BulkCreateTaskRequest = InferInput<typeof bulkCreateTaskRequest>;
export type BulkCreateTaskResponse = InferInput<typeof bulkCreateTaskResponse>;
