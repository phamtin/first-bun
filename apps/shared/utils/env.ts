const getEnvUrl = (instance: "redis" | "mongo") => {
	if (instance === "redis") {
		if (Bun.env.BUN_ENV === "production") {
			return {
				host: Bun.env.REDIS_HOST,
				port: 6379,
			};
		}
		return {
			host: Bun.env.REDIS_HOST || "localhost",
			port: 6379,
		};
	}
	if (instance === "mongo") {
		return Bun.env.MONGODB_HOST || "mongodb";
	}
	return "";
};

export const getEnv = {
	redis: getEnvUrl("redis") as { host: string; port: number },
};
