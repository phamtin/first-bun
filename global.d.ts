import type { Context } from "hono";

declare module "hono" {
	interface ContextVariableMap extends Context {
		user: {
			_id: string;
			email: string;
			fullname: string;
			firstname: string;
			lastname: string;
		};
	}
}
