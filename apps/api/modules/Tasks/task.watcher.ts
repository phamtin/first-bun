import type { ChangeStreamDocument, ChangeStreamUpdateDocument } from "mongodb";
import type { TaskModel } from "@/shared/database/model/task/task.model";

const onTaskUpdated = (change: ChangeStreamUpdateDocument<TaskModel>) => {
	console.log("[ TaskModel ] Updated = ", change);
};

const taskWatcher = (change: ChangeStreamDocument<TaskModel>) => {
	console.log("[ TaskModel ] Changed:", change);

	switch (change.operationType) {
		case "update":
			onTaskUpdated(change);
			break;

		case "insert":
			console.log("[ TaskModel ] Inserted:", change.fullDocument);
			break;

		default:
			break;
	}
};

export { taskWatcher };
