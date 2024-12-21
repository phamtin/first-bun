import { MongoClient, type Db, type Collection, type Document } from "mongodb";
import type { TaskModel } from "../database/model/task/task.model";
import type { AccountModel } from "../database/model/account/account.model";
import type { TokenModel } from "../database/model/token/token.schema";
import { ChangeStreamSingleton } from "@/pkgs/mongodb/changeStream/changeStream";

const MONGO_URL = Bun.env.MONGODB_URL_ATLAS as string;

const dbName = "blitz";

const client = new MongoClient(MONGO_URL);

let db: Db | null = null;

let isConnecting = false;

export const connectToDatabase = async (): Promise<Db | null> => {
	if (db?.admin()) {
		return db;
	}
	if (isConnecting) {
		while (isConnecting) {
			console.log("isConnecting = ", isConnecting);
			await new Promise((resolve) => setTimeout(resolve, 500));
		}
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

type CollectionType<T> = Collection<T extends Document ? T : Document>;

connectToDatabase().then((db) => {
	if (!db) {
		throw new Error("Failed to connect to database");
	}
	AccountColl = db.collection<AccountModel>("accounts");
	TaskColl = db.collection<TaskModel>("tasks");
	TokenColl = db.collection<TokenModel>("tokens");
});

export let TokenColl: CollectionType<TokenModel>;
export let AccountColl: CollectionType<AccountModel>;
export let TaskColl: CollectionType<TaskModel>;
