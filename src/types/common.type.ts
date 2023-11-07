import { t } from "elysia";
import { ObjectId } from "mongodb";

/**
 *  Attribute pattern support MongoDb store
 */
export type AttributePattern = {
	k: string;
	v: string;
};
export const attributePattern = t.Object({
	k: t.String(),
	v: t.String(),
});

/**
 *  recursively map a type with ObjectId to string
 */
export type StringId<T> = T extends ObjectId
	? string
	: T extends Record<any, any>
	? {
			[K in keyof T]: StringId<T[K]>;
	  }
	: T;

export type Null<T> = T | null;
