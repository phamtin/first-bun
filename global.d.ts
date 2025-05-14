import type { Context } from "hono";

declare module "hono" {
	interface ContextVariableMap extends Context {
		user: {
			_id: string;
			email: string;
			username: string;
			firstname: string;
			lastname: string;
		};
	}
}
