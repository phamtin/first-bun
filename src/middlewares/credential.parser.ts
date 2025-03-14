import { createMiddleware } from "hono/factory";
import { ALLOWED_DOMAINS } from "@/utils/validate";

export const creadentialParser = createMiddleware(async (c, next) => {
	const host = c.req.header("Host");

	if (!host || !ALLOWED_DOMAINS[host]) {
		return c.text("Domain not allowed", 403);
	}

	const blitzHeader = c.req.header("X-blitz");

	if (!blitzHeader) return c.text("Invalid Proxy setup", 403);

	await next();
});
