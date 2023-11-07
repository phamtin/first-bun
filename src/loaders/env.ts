declare module "bun" {
	interface Env {
		BUN_ENV: string;
		API_PORT: string;
		DB_URL: string;
		DB_URL_ATLAS: string;
		JWT_SECRET: string;
		REDIS_HOST: string;
		REDIS_PORT: string;
		ACCESS_TOKEN_EXPIRE_MINUTE: string;
	}
}
