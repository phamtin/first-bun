import { TaskStatus } from "@/shared/database/model/task/task.model";

const EXCLUDED_TASK_STATUS: Record<TaskStatus, boolean> = {
	[TaskStatus.Archived]: true,
	[TaskStatus.NotStartYet]: false,
	[TaskStatus.InProgress]: false,
	[TaskStatus.Done]: false,
	[TaskStatus.Pending]: false,
};

export { EXCLUDED_TASK_STATUS };
