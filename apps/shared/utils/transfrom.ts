import type { Context as HonoContext } from "hono";
import { ObjectId } from "mongodb";
import type { Context, UserCheckParser } from "../types/app.type";

export function sanitize<T>(obj: T): T {
	for (const propName in obj) {
		if (typeof obj[propName] === "undefined") {
			delete obj[propName];
		} else if (typeof obj[propName] === "object") {
			sanitize(obj[propName]);
		}
	}

	return obj;
}

export function classifyError(code: string): number {
	let status = 500;
	switch (code) {
		case "INTERNAL_SERVER_ERROR":
			status = 500;
			break;
		case "NOT_FOUND":
			status = 404;
			break;
		case "VALIDATION":
		case "PARSE":
		case "BAD_REQUEST":
			status = 400;
			break;
		case "UNAUTHORIZED":
		case "INVALID_COOKIE_SIGNATURE":
			status = 401;
			break;
		case "FORBIDDEN":
			status = 403;
			break;
		case "METHOD_NOT_SUPPORTED":
			status = 405;
			break;
		case "TOO_MANY_REQUESTS":
			status = 429;
			break;
		default:
			break;
	}

	return status;
}

type FlattenedObject = Record<string, unknown>;

export const toPayloadUpdate = (obj: FlattenedObject, parentKey = "", result: FlattenedObject = {}): FlattenedObject => {
	if (obj === null || typeof obj !== "object") {
		throw new Error("Input must be a non-null object");
	}

	for (const key in obj) {
		if (Object.hasOwn(obj, key)) {
			const value = obj[key];
			const newKey = parentKey ? `${parentKey}.${key}` : key;

			// Keep valid MongoDB ObjectId as-is
			if (value instanceof ObjectId) {
				result[newKey] = value;
			}

			//	Data is Date
			else if (value instanceof Date) {
				result[newKey] = value;
			}

			//	Data is Array
			else if (Array.isArray(value)) {
				result[newKey] = value;
			}

			//	Data is null, undefined
			else if (value === null || value === undefined) {
				result[newKey] = value;
			}

			//	Data is object
			else if (typeof value === "object") {
				toPayloadUpdate(value as FlattenedObject, newKey, result);
			}

			// Data is primitive
			else {
				result[newKey] = value;
			}
		}
	}

	return result;
};

export const AppContext = (ctx: HonoContext): Context => {
	return {
		jwtPayload: ctx.get("jwtPayload"),
		user: ctx.get("user") as UserCheckParser,
	};
};
