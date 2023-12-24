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

export {};

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
