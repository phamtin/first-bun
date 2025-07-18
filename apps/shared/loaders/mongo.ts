import { MongoClient, type Db, type Collection, type Document, type WithoutId } from "mongodb";
import { ChangeStreamSingleton } from "../services/mongodb/changeStream/changeStream";
import type { TaskModel } from "../database/model/task/task.model";
import type { AccountModel } from "../database/model/account/account.model";
import type { TokenModel } from "../database/model/token/token.schema";
import type { FolderModel } from "../database/model/folder/folder.model";
import type { NotificationModel, NotificationType } from "../database/model/notification/notification.model";
import type { PomodoroModel } from "../database/model/pomodoro/pomodoro.model";

const MONGO_URL = Bun.env.MONGODB_URL_ATLAS as string;

const dbName = "blitz";

export const client = new MongoClient(MONGO_URL);

let db: Db | null = null;

let isConnecting = false;

process.on("SIGINT", async () => {
	closeMongoConnection();
	process.exit(0);
});

export const connectToDatabase = async (): Promise<Db | null> => {
	if (db?.admin()) {
		return db;
	}
	if (isConnecting) {
		await new Promise((resolve) => setTimeout(resolve, 1000));
		return db;
	}
	isConnecting = true;

	try {
		await client.connect();
		console.log("- Connected to MongoDB server");
		db = client.db(dbName);
	} catch (error) {
		console.error("Error connecting to MongoDB:", error);
		throw error;
	} finally {
		isConnecting = false;
	}

	return db;
};

export const closeMongoConnection = async (): Promise<void> => {
	console.log("Closing MongoDB connection");
	try {
		await ChangeStreamSingleton.closeAllChangeStreams();

		await client.close();
		console.log("Closed MongoDB connection");
		db = null;
	} catch (error) {
		console.error("Error closing MongoDB connection:", error);
	} finally {
		process.exit(0);
	}
};

export type CollectionType<T> = Collection<T extends Document ? T : Document>;

connectToDatabase().then((db) => {
	if (!db) {
		throw new Error("Failed to connect to database");
	}
	AccountColl = db.collection<WithoutId<AccountModel>>("accounts");
	TaskColl = db.collection<WithoutId<TaskModel>>("tasks");
	TokenColl = db.collection<WithoutId<TokenModel>>("tokens");
	FolderColl = db.collection<WithoutId<FolderModel>>("folders");
	NotificationColl = db.collection<WithoutId<NotificationModel<NotificationType>>>("notifications");
	PomodoroColl = db.collection<WithoutId<PomodoroModel>>("pomodoros");
});

export let TokenColl: CollectionType<WithoutId<TokenModel>>;
export let AccountColl: CollectionType<WithoutId<AccountModel>>;
export let TaskColl: CollectionType<WithoutId<TaskModel>>;
export let FolderColl: CollectionType<WithoutId<FolderModel>>;
export let NotificationColl: CollectionType<WithoutId<NotificationModel<NotificationType>>>;
export let PomodoroColl: CollectionType<WithoutId<PomodoroModel>>;
