import type { Context } from "@/shared/types/app.type";
import fs from "node:fs";
import { parse } from "csv-parse";
import { ObjectId, type WithoutId } from "mongodb";
import { TaskColl } from "@/shared/loaders/mongo";
import type { TaskModel, TaskTiming } from "@/shared/database/model/task/task.model";
import type { AccountModel } from "@/shared/database/model/account/account.model";
import { AppError } from "@/shared/utils/error";
import path from "node:path";
import { QueueContainer } from "@/shared/services/bullMQ/queue/BaseQueue";
import { QueueName } from "@/shared/services/bullMQ/type";
import { randomUUIDv7 } from "bun";

const parseOptions = {
	delimiter: "\t", // Specify tab as the delimiter
	relax_quotes: true, // Allow quotes in unquoted fields
	columns: true, // Treat the first row as headers
	trim: true,
};

const BATCH_RECORDS: Record<string, string>[] = [];

const handleRecord = async (record: Record<string, string>) => {
	console.log("handleRecord: ", record.id);

	try {
		if (BATCH_RECORDS.length >= 99) {
			const batchId = randomUUIDv7();

			await QueueContainer().add(QueueName.ETLQueue, "Transform", {
				payload: {
					batchId,
					tasks: BATCH_RECORDS,
				},
			});

			BATCH_RECORDS.length = 0;
			BATCH_RECORDS.push(record);
		} else {
			BATCH_RECORDS.push(record);
		}
	} catch (error) {
		console.log("handleRecord: ", error);
	}
};

const readCsvFile = async (ctx: Context, request: WithoutId<TaskModel>[]): Promise<boolean> => {
	const aa = performance.now();
	const filePath = path.join(__dirname, "../../../resources/sample-rspct.csv");
	const parser = parse(parseOptions);
	const stream = fs.createReadStream(filePath).pipe(parser);

	const batch = [];

	stream
		.on("data", handleRecord)
		.on("error", (error: unknown) => {
			console.error("Parser error:", error);
		})
		.on("end", () => {
			console.log("Finished processing CSV file: ", batch.length, " items");
			console.log("Duration = ", performance.now() - aa);
		});

	return true;
};
const bulkCreateTask = async (ctx: Context, request: WithoutId<TaskModel>[]): Promise<boolean> => {
	return true;
};

const SandboxSrv = {
	bulkCreateTask,
	readCsvFile,
};

export default SandboxSrv;
