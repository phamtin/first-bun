import type { Context } from "@/types/app.type";
import { type ErrorCode, type ErrorResponse, codeToStatus } from "./error";

export const responseOK = <T>(c: Context, data: T) => {
	return c.json({
		status: 200,
		data,
	});
};

export const responseError = (c: Context, code: ErrorCode, message: string) => {
	return c.json<ErrorResponse>({
		status: codeToStatus(code),
		code,
		message,
		requestId: c.get("requestId"),
	});
};
