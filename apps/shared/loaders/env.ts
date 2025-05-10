declare module "bun" {
	interface Env {
		BUN_ENV: string;
		API_PORT: string;
		MONGODB_URL: string;
		MONGODB_URL_ATLAS: string;
		JWT_SECRET: string;
		REDIS_HOST: string;
		ACCESS_TOKEN_EXPIRE_MINUTE: string;
	}
}
