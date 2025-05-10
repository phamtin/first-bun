import type { ObjectId } from "mongodb";

export type TokenModel = {
	_id: ObjectId;

	value: string;
	isPrimary: boolean;
	accountId: ObjectId;
	expiredAt: Date;

	createdAt: Date;
	updatedAt?: Date;
	createdBy?: ObjectId;
	deletedAt?: Date;
	deletedBy?: ObjectId;
};
