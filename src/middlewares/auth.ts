import { Elysia } from "elysia";
import { ObjectId } from "mongodb";

import { AccountColl } from "../loaders/mongo";
import AppError from "@/pkgs/appError/Error";
import { Context } from "@/types/app.type";

export const isAuthenticated = (app: Elysia) =>
	// @ts-ignore
	app.derive(async ({ set, store }) => {
		const appStore: Context = store as Context;

		if (!appStore.user._id) {
			set.status = 401;
			throw new AppError("UNAUTHORIZED");
		}

		const user = await AccountColl.findOne({ _id: new ObjectId(appStore.user._id) });

		if (!user || !user._id) {
			set.status = 401;
			throw new AppError("UNAUTHORIZED");
		}

		return;
	});
