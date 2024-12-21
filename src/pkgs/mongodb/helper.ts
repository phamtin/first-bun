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

export { toObjectId, toStringId };
