import type { TaskModel } from "@/shared/database/model/task/task.model";
// import { taskWatcher } from "@/api/modules/Tasks/task.watcher";
import { connectToDatabase } from "../../../loaders/mongo";
import type { ChangeStream, ChangeStreamDocument, Document, ChangeStreamOptions } from "mongodb";

// Singleton pattern for change streams
export class ChangeStreamSingleton {
	private static instances: { [key: string]: ChangeStream<Document> } = {};

	static async getChangeStream<T extends Document>(collectionName: string, options?: ChangeStreamOptions): Promise<ChangeStream<T>> {
		if (!ChangeStreamSingleton.instances[collectionName]) {
			const db = await connectToDatabase();

			if (!db) throw new Error("Failed to connect to database");

			const collection = db.collection(collectionName);

			const changeStream = collection.watch<T, ChangeStreamDocument<T>>([], {
				fullDocument: "updateLookup",
				...options,
			});
			ChangeStreamSingleton.instances[collectionName] = changeStream;

			changeStream.on("error", async (err) => {
				await ChangeStreamSingleton.closeChangeStream(collectionName);
				throw err;
			});
			changeStream.on("close", async () => {
				await ChangeStreamSingleton.closeChangeStream(collectionName);
			});
		}

		return ChangeStreamSingleton.instances[collectionName] as ChangeStream<T>;
	}

	private static async closeChangeStream(collectionName: string): Promise<void> {
		const changeStream = ChangeStreamSingleton.instances[collectionName];

		if (changeStream) {
			try {
				await changeStream.close();
				console.log(`Change stream for ${collectionName} closed.`);
			} catch (err) {
				console.error(`Failed to close changeStream for ${collectionName}:`, err);
			} finally {
				delete ChangeStreamSingleton.instances[collectionName];
			}
		}
	}

	static async closeAllChangeStreams(): Promise<void> {
		for (const collectionName in ChangeStreamSingleton.instances) {
			await ChangeStreamSingleton.closeChangeStream(collectionName);
		}
	}

	async checkOnline(): Promise<void> {
		const db = await connectToDatabase();
		if (!db) {
			throw new Error("Failed to connect to database");
		}
		await db.admin().ping();
	}
}

async function initChangeStream() {
	try {
		console.log(initChangeStream);

		// const changeStream = await ChangeStreamSingleton.getChangeStream<TaskModel>("tasks");
		// changeStream.on("change", taskWatcher);
	} catch (err) {
		ChangeStreamSingleton.closeAllChangeStreams();
		console.error("Failed to start change stream:", err);
	}
}

export { initChangeStream };
