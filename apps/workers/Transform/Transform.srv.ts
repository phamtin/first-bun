import type { Job } from "bullmq";
import { ObjectId, type WithoutId } from "mongodb";
import type { FolderModel } from "@/shared/database/model/folder/folder.model";
import { type SubTask, type TaskModel, TaskPriority, TaskStatus } from "@/shared/database/model/task/task.model";
import { FolderColl, TaskColl } from "@/shared/loaders/mongo";
import type { ETLQueueJob, QueueName, QueueStruct } from "@/shared/services/bullMQ/type";
import dayjs from "@/shared/utils/dayjs";

const PREDEFINED_DATA: Record<string, FolderModel[]> = {
	folders: [],
	accounts: [],
};

const BATCH_INSERT: WithoutId<TaskModel>[] = [];

const transformDataProcessor = async (job: Job<ETLQueueJob>) => {
	const aa = performance.now();
	console.log(`-------------------- START job ${job.id} --------------------`);

	const transformPayload = job.data.payload as QueueStruct[QueueName.ETLQueue]["Transform"]["payload"];
	const now = dayjs().toDate();

	if (PREDEFINED_DATA.folders.length === 0) {
		await populatePrefinedData();
	}

	for (let i = 0; i < transformPayload.tasks.length; i++) {
		const record = transformPayload.tasks[i] as Record<string, string>;

		const taskData: WithoutId<Partial<TaskModel>> = {
			title: record.title as string,
			description: `${record.selftext} - TEST_BATCH_INSERT_`,
			createdAt: now,
			timing: { estimation: 4 },
		};

		// FolderId
		const randomNum = Math.floor(Math.random() * PREDEFINED_DATA.folders.length);

		taskData.folderId = PREDEFINED_DATA.folders[randomNum]._id;

		// Task Status
		const randomStatus = Math.floor(Math.random() * 10);
		if (randomStatus < 2) {
			taskData.status = TaskStatus.NotStartYet;
		} else if (randomStatus < 4) {
			taskData.status = TaskStatus.InProgress;
		} else if (randomStatus < 6) {
			taskData.status = TaskStatus.Done;
		} else {
			taskData.status = TaskStatus.Archived;
		}

		// Task Priority
		const randomPriority = Math.floor(Math.random() * 10);
		if (randomPriority < 2) {
			taskData.priority = TaskPriority.Low;
		} else if (randomPriority < 4) {
			taskData.priority = TaskPriority.Medium;
		} else if (randomPriority < 6) {
			taskData.priority = TaskPriority.High;
		} else {
			taskData.priority = TaskPriority.Critical;
		}

		// Assignee
		const randomAssignee = Math.floor(Math.random() * PREDEFINED_DATA.folders.length);

		if (randomAssignee % 3 === 0) {
			taskData.assigneeInfo = [PREDEFINED_DATA.folders[randomAssignee].participantInfo.owner];
		} else {
			if (PREDEFINED_DATA.folders[randomAssignee].participantInfo.members?.[1]) {
				taskData.assigneeInfo = [PREDEFINED_DATA.folders[randomAssignee].participantInfo.members[1]];
			} else if (PREDEFINED_DATA.folders[randomAssignee].participantInfo.members?.[0]) {
				taskData.assigneeInfo = [PREDEFINED_DATA.folders[randomAssignee].participantInfo.members[0]];
			} else {
				taskData.assigneeInfo = [PREDEFINED_DATA.folders[randomAssignee].participantInfo.owner];
			}
		}

		// Subtasks
		const randomSubtasks = Math.floor(Math.random() * 10);
		if (randomSubtasks < 2) {
			const subTasks: SubTask[] = [];
			for (let j = 0; j < 100; j++) {
				subTasks.push({
					_id: new ObjectId(),
					title: record.title,
					status: j % 3 === 0 ? TaskStatus.NotStartYet : TaskStatus.Done,
				});
			}
			taskData.subTasks = subTasks;
		} else if (randomSubtasks < 4) {
			taskData.subTasks = [
				{
					_id: new ObjectId(),
					title: record.title,
					status: i % 2 === 0 ? TaskStatus.NotStartYet : TaskStatus.Done,
				},
			];
		} else if (randomSubtasks < 6) {
			taskData.subTasks = [
				{
					_id: new ObjectId(),
					title: record.title,
				},
				{
					_id: new ObjectId(),
					title: record.title,
				},
			];
		} else {
			taskData.subTasks = [];
		}

		BATCH_INSERT.push(taskData as WithoutId<TaskModel>);
	}

	if (BATCH_INSERT.length >= 99) {
		await TaskColl.insertMany(BATCH_INSERT);
		BATCH_INSERT.length = 0;
	}

	console.log("Worker Duration = ", performance.now() - aa);
	return { status: "success" };
};

const populatePrefinedData = async () => {
	const folders = await FolderColl.find({}).toArray();

	PREDEFINED_DATA.folders = folders;
};

export { transformDataProcessor };
