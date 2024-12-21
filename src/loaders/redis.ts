import { createClient, type RedisClientType } from "redis";

class Redis {
	private static client: RedisClientType | null = null;

	private constructor() {
		// Private constructor to prevent instantiation
	}

	public static async connectToRedis(): Promise<void> {
		if (!Redis.client) {
			Redis.client = createClient({ url: `redis://${Bun.env.REDIS_HOST}:6379` });

			await Redis.client.connect();

			console.log("- Connected to Redis server");
		}
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

	public static getClient(): RedisClientType | null {
		return Redis.client;
	}
}

process.on("SIGINT", async () => {
	await Redis.closeRedisConnection();
	process.exit(0);
});

export async function connectToRedis(): Promise<void> {
	return Redis.connectToRedis();
}

export async function closeRedisConnection(): Promise<void> {
	return Redis.closeRedisConnection();
}

export default Redis;
