import {MongoClient} from "mongodb";
import {TaskModel} from "@/modules/Tasks/task.model";
import {AccountModel} from "@/modules/Accounts/account.model";
import {TokenSchema} from "@/modules/Auth/auth.model";
import {TagModel} from "@/modules/Tags/tag.model";

const client = new MongoClient(Bun.env.DB_URL);

const db = client.db("blitz_app");

export const AccountColl = db.collection<AccountModel>("accounts");

export const TokenColl = db.collection<TokenSchema>("tokens");

export const TaskColl = db.collection<TaskModel>("tasks");

export const TagColl = db.collection<TagModel>("tags");
