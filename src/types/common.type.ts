import { t } from "elysia";
import { ObjectId } from "mongodb";

export type Null<T> = T | null;

export type Undefined<T> = T | undefined;

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

/**
 *  recursively mark a prop become optional
 */
export type DeepPartial<T> = T extends string | number | bigint | boolean | null | undefined | symbol | Date
	? T | undefined
	: // Arrays, Sets and Maps and their readonly counterparts have their items made
	// deeply partial, but their own instances are left untouched
	T extends Array<infer ArrayType>
	? Array<ArrayType>
	: T extends ReadonlyArray<infer ArrayType>
	? ReadonlyArray<ArrayType>
	: T extends Set<infer SetType>
	? Set<DeepPartial<SetType>>
	: T extends ReadonlySet<infer SetType>
	? ReadonlySet<SetType>
	: T extends Map<infer KeyType, infer ValueType>
	? Map<DeepPartial<KeyType>, DeepPartial<ValueType>>
	: T extends ReadonlyMap<infer KeyType, infer ValueType>
	? ReadonlyMap<DeepPartial<KeyType>, DeepPartial<ValueType>>
	: // ...and finally, all other objects.
	  {
			[K in keyof T]?: DeepPartial<T[K]>;
	  };
