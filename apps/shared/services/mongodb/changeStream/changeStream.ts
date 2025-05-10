import { connectToDatabase } from "../../../loaders/mongo";
import type { ChangeStream } from "mongodb";

// Singleton pattern for change streams
export class ChangeStreamSingleton {
	private static instances: { [key: string]: ChangeStream } = {};

	static async getChangeStream(collectionName: string): Promise<ChangeStream> {
		if (!ChangeStreamSingleton.instances[collectionName]) {
			const db = await connectToDatabase();

			if (!db) {
				throw new Error("Failed to connect to database");
			}
			const collection = db.collection(collectionName);

			const changeStream = collection.watch([], {
				fullDocument: "updateLookup",
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

		return ChangeStreamSingleton.instances[collectionName];
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

// Usage example
// async function startMonitoring() {
//     try {
//         const changeStream = await ChangeStreamSingleton.getChangeStream('your-collection-name');

//         changeStream.on('change', change => {
//             if (change.operationType === 'update') {
//                 console.log('Change in electronics category:', change.fullDocument);
//                 // Handle changes for documents in the 'electronics' category
//             }
//         });
//     } catch (err) {
//         console.error('Failed to start change stream:', err);
//     }
// }

// startMonitoring();
