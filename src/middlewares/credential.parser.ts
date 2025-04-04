import { createMiddleware } from "hono/factory";

export const creadentialParser = createMiddleware(async (c, next) => {
	const host = c.req.header("Host");

	if (!host) return c.text("Domain not allowed", 403);

	const blitzHeader = c.req.header("X-blitz");

	if (!blitzHeader) return c.text("Invalid Proxy setup", 403);

	await next();
});
