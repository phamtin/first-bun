import type { ObjectId } from "mongodb";

export type TokenSchema = {
	token: string;
	userId: ObjectId;
	isPrimary: boolean;
	expiredAt: Date;
	createdAt: Date;
};
