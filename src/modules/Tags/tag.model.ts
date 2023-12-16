import { t } from "elysia";
import { ObjectId } from "mongodb";

/**
 *  -----------------------------
 *	|
 * 	| Mongo Model - Tag
 *	|
 * 	-----------------------------
 */
export type TagModel = {
	_id: ObjectId;

	title: string;
	color: string;
	ownerId: ObjectId;

	createdAt: Date;
	updatedAt: Date;
};

export const tagModel = t.Object({
	_id: t.String(),
	title: t.String(),
	ownerId: t.String(),
	color: t.String(),

	createdAt: t.Date(),
	updatedAt: t.Date(),
});
