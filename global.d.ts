import type { Context } from "@/shared/types/app.type";

declare module "hono" {
	interface ContextVariableMap extends Context {
		user: {
			_id: string;
			email: string;
			username: string;
			firstname: string;
			lastname: string;
			phoneNumber: string;
			locale: string;
			isPrivateAccount: boolean;
			avatar: string;
		};
	}
}
