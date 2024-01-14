import { t } from "elysia";
import { ObjectId } from "mongodb";

/**
 *  -----------------------------
 *	|
 * 	| Mongo Model - Tag
 *	|
 * 	-----------------------------
 */
export type TaskTagModel = {
	_id: ObjectId;

	title: string;
	color: string;
};

export const taskTagModel = t.Object({
	_id: t.String(),
	title: t.String(),
	color: t.String(),
});
