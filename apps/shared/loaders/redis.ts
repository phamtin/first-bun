import { getEnv } from "@/shared/utils/env";
import IoRedis from "ioredis";

class Redis {
	private static client: IoRedis | null = null;

	private constructor() {
		// Private constructor to prevent instantiation
	}

	public static async connectToRedis(): Promise<IoRedis | null> {
		if (!Redis.client) {
			try {
				const host = getEnv.redis.host;
				const port = +getEnv.redis.port;

				Redis.client = new IoRedis({ host, port, maxRetriesPerRequest: null });

				await Redis.client.set("ping", "pong");
				await Redis.client.del("ping");

				return Redis.client;
			} catch (error) {
				console.error("❌ Error while connecting to Redis:", error);
				throw error;
			}
		}
		return Redis.client as IoRedis;
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

	public static getClient(): IoRedis {
		if (!Redis.client) {
			throw new Error("Redis client not initialized");
		}
		return Redis.client as IoRedis;
	}
}

process.on("SIGINT", async () => {
	Redis.closeRedisConnection();
	process.exit(0);
});

export async function connectToRedis(): Promise<Redis | null> {
	const instance = await Redis.connectToRedis();
	return instance;
}

export async function closeRedisConnection(): Promise<void> {
	console.log("Closing Redis connection");

	return Redis.closeRedisConnection();
}

export default Redis;
