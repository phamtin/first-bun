import { ObjectId } from "mongodb";

const toObjectId = (id: string | ObjectId = ""): ObjectId => {
	if (typeof id === "string") {
		return ObjectId.createFromHexString(id);
	}
	return id;
};

const toStringId = (id: ObjectId | null | undefined): string => {
	if (id instanceof ObjectId) {
		return id.toHexString();
	}
	return "";
};

const toObjectIds = (obj: unknown): unknown => {
	if (typeof obj === "string") {
		return ObjectId.isValid(obj) ? new ObjectId(obj) : obj;
	}

	if (Array.isArray(obj)) {
		return obj.map(toObjectIds);
	}

	if (obj !== null && typeof obj === "object") {
		return Object.entries(obj).reduce<Record<string, unknown>>((acc, [key, value]) => {
			acc[key] = toObjectIds(value);
			return acc;
		}, {});
	}

	return obj as object;
};

export { toObjectId, toStringId, toObjectIds };
