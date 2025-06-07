import { custom, type CustomSchema, string, strictObject, type BaseSchema, type BaseIssue, pipe, union, array, transform } from "valibot";
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

/**
 *  recursively map a type with ObjectId to string
 */
export type StringId<T> = T extends ObjectId
	? string
	: T extends object
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

export const vAttributePattern = strictObject({
	k: string(),
	v: string(),
});

export const objectId = custom((value): value is ObjectId => {
	return typeof value === "string" && ObjectId.isValid(value);
}) as CustomSchema<ObjectId, undefined>;

export const stringObjectId = custom<string>((value) => {
	if (typeof value !== "string") {
		return false;
	}
	const objectIdPattern = /^[a-f\d]{24}$/i; // Regex to match valid ObjectId format
	if (!objectIdPattern.test(value)) {
		return false;
	}

	return true;
});

export function coercedArray<T>(schema: BaseSchema<T, T, BaseIssue<unknown>>): BaseSchema<T[], T[], BaseIssue<unknown>> {
	return pipe(
		union([array(schema), schema]),
		transform((input): T[] => (Array.isArray(input) ? (input.length === 1 ? [input[0], input[0]] : input) : [input, input])),
	) as BaseSchema<T[], T[], BaseIssue<unknown>>;
}
