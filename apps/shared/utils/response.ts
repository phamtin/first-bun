import type { Context } from "hono";
import { type ErrorCode, type ErrorResponse, codeToStatus } from "./error";
import type { ErrorKey } from "./error-key";

export const responseOK = <T>(c: Context, data: T) => {
	return c.json({
		status: 200,
		data,
	});
};

export const responseError = (c: Context, code: ErrorCode, message: string, errkey?: ErrorKey) => {
	return c.json<ErrorResponse>({
		status: codeToStatus(code),
		code,
		message,
		requestId: c.get("requestId"),
		errkey,
	});
};

export const selectFields = <T>(fields: (keyof T)[]) => {
	const selectFields: Record<string, number> = { _id: 1 };

	if (fields.length === 0) return selectFields;

	for (const field of fields) {
		if (field === "_id") continue;

		selectFields[field as string] = 1;
	}

	return selectFields;
};
