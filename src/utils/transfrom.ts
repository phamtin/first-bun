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
	let status = 401;
	switch (code) {
		case "INTERNAL_SERVER_ERROR":
			status = 500;
			break;
		case "NOT_FOUND":
			status = 404;
			break;
		case "VALIDATION":
			status = 400;
			break;
		case "INVALID_COOKIE_SIGNATURE":
			status = 403;
			break;
		case "PARSE":
			status = 400;
			break;
		default:
			break;
	}

	return status;
}
