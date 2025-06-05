import { literal, string, object, union, optional, enum as enumSchema } from "valibot";
import type { BaseIssue, InferInput } from "valibot";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { StatusCode } from "hono/utils/http-status";
import { responseError } from "./response";
import { ErrorKey } from "./error-key";

const ErrorCodeSchema = union([
	literal("BAD_REQUEST"),
	literal("FORBIDDEN"),
	literal("INTERNAL_SERVER_ERROR"),
	literal("USAGE_EXCEEDED"),
	literal("NOT_FOUND"),
	literal("RATE_LIMITED"),
	literal("UNAUTHORIZED"),
	literal("INSUFFICIENT_PERMISSIONS"),
	literal("METHOD_NOT_ALLOWED"),
]);

const ErrorStatusSchema = union([literal(400), literal(401), literal(403), literal(404), literal(405), literal(429), literal(500)]);

export const ErrorSchema = object({
	status: ErrorStatusSchema,
	code: ErrorCodeSchema,
	message: string(),
	requestId: string(),
	errkey: optional(enumSchema(ErrorKey)),
});

export type ErrorCode = InferInput<typeof ErrorCodeSchema>;

export type ErrorStatus = InferInput<typeof ErrorStatusSchema>;

export type ErrorResponse = InferInput<typeof ErrorSchema>;

export const codeToStatus = (code: ErrorCode): ErrorStatus => {
	switch (code) {
		case "BAD_REQUEST":
			return 400;
		case "UNAUTHORIZED":
			return 401;
		case "FORBIDDEN":
		case "INSUFFICIENT_PERMISSIONS":
			return 403;
		case "NOT_FOUND":
			return 404;
		case "METHOD_NOT_ALLOWED":
			return 405;
		case "RATE_LIMITED":
		case "USAGE_EXCEEDED":
			return 429;
		case "INTERNAL_SERVER_ERROR":
			return 500;
	}
};

function statusToCode(status: StatusCode): ErrorCode {
	switch (status) {
		case 400:
			return "BAD_REQUEST";
		case 401:
			return "UNAUTHORIZED";
		case 403:
			return "FORBIDDEN";

		case 404:
			return "NOT_FOUND";

		case 405:
			return "METHOD_NOT_ALLOWED";
		case 500:
			return "INTERNAL_SERVER_ERROR";
		default:
			return "INTERNAL_SERVER_ERROR";
	}
}

export class AppError extends HTTPException {
	public readonly code: ErrorCode;
	public readonly errkey?: ErrorKey;

	constructor(code: ErrorCode, message = "", errkey?: ErrorKey) {
		super(codeToStatus(code), { message });
		this.code = code;
		this.errkey = errkey;
	}
}

export const handleError = (err: Error, c: Context): Response => {
	/**
	 * 	This is error that we imperatively throw by ourselves
	 */
	if (err instanceof AppError) {
		if (err.status >= 500) {
			console.error(err.message, {
				name: err.name,
				code: err.code,
				status: err.status,
			});
		}
		return responseError(c, err.code, err.message, err.errkey);
	}

	/**
	 * 	HTTPExceptions from hono, give us some insights
	 */
	if (err instanceof HTTPException) {
		if (err.status >= 500) {
			console.error("HTTPException", {
				message: err.message,
				status: err.status,
				requestId: c.get("requestId"),
			});
		}
		const code = statusToCode(err.status);
		return responseError(c, code, err.message);
	}

	/**
	 * 	We're lost here, all we can do is return a 500 and trace later
	 */
	console.error("unhandled exception", err);
	return responseError(c, "INTERNAL_SERVER_ERROR", err.message);
};

export const getValidationErrorMsg = (issues: BaseIssue<unknown>["issues"]) => {
	return `${issues?.[0].path?.[0].key}: ${issues?.[0].message}`;
};
