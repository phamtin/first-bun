export type ErrorCode = "BAD_REQUEST" | "INTERNAL_SERVER_ERROR" | "UNAUTHORIZED" | "FORBIDDEN" | "METHOD_NOT_SUPPORTED" | "TIMEOUT" | "TOO_MANY_REQUESTS" | "NOT_FOUND";

const ErrorMap: Record<ErrorCode, number> = {
	NOT_FOUND: 404,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	METHOD_NOT_SUPPORTED: 405,
	TIMEOUT: 408,
	TOO_MANY_REQUESTS: 429,
	INTERNAL_SERVER_ERROR: 500,
};

class AppError extends Error {
	public readonly statusCode: number;
	public readonly status: string;
	public readonly isOperational: boolean;

	constructor(code: ErrorCode, message?: string) {
		super(message ?? code);

		this.statusCode = ErrorMap[code];
		this.status = `${ErrorMap[code]}`.startsWith("4") ? "fail" : "error";
		this.isOperational = true;

		Error.captureStackTrace(this, this.constructor);
	}
}

export default AppError;
