import * as v from "valibot";
import type { InferInput } from "valibot";
import { createTaskRequest } from "../../Tasks/task.validator";
import { vTaskModel } from "@/shared/database/model/task/task.model";

export const bulkCreateTaskRequest = v.strictObject({
	tasks: v.array(createTaskRequest),
});

export const bulkCreateTaskResponse = v.array(vTaskModel);

export type BulkCreateTaskRequest = InferInput<typeof bulkCreateTaskRequest>;
export type BulkCreateTaskResponse = InferInput<typeof bulkCreateTaskResponse>;
