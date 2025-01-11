import IoRedis from "ioredis";

class Redis {
	private static client: IoRedis | null = null;

	private constructor() {
		// Private constructor to prevent instantiation
	}

	public static async connectToRedis(): Promise<Redis> {
		if (!Redis.client) {
			Redis.client = new IoRedis({ host: Bun.env.REDIS_HOST, port: 6379, maxRetriesPerRequest: null });

			console.log("- Connected to Redis server");
		}

		return Redis.client;
	}

	public static async closeRedisConnection(): Promise<void> {
		if (Redis.client) {
			console.log("Closing Redis connection");
			try {
				await Redis.client.quit();
			} catch (error) {
				console.error("Error while closing Redis connection:", error);
			} finally {
				Redis.client = null;
			}
		}
	}

	public static getClient(): IoRedis | null {
		return Redis.client;
	}
}

process.on("SIGINT", async () => {
	Redis.closeRedisConnection();
	process.exit(0);
});

export async function connectToRedis(): Promise<Redis> {
	return Redis.connectToRedis();
}

export async function closeRedisConnection(): Promise<void> {
	return Redis.closeRedisConnection();
}

export default Redis;
