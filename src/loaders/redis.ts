import IoRedis from "ioredis";

class Redis {
	private static client: IoRedis | null = null;

	private constructor() {
		// Private constructor to prevent instantiation
	}

	public static async connectToRedis(): Promise<IoRedis> {
		if (!Redis.client) {
			try {
				const host = Bun.env.REDIS_HOST || "redis";
				const port = Number(Bun.env.REDIS_PORT) || 6379;

				console.log("MongoDb connecting...");

				await new Promise((resolve) => setTimeout(resolve, 2000)); // 2-second delay

				// Retry connection with exponential backoff
				const retryAttempts = 3;
				let attempt = 0;

				while (attempt < retryAttempts) {
					try {
						Redis.client = new IoRedis({ host, port, maxRetriesPerRequest: null });

						Redis.client.on("connect", () => {
							console.log("- Connected to Redis server");
							return Redis.client;
						});

						Redis.client.on("error", (err) => {
							console.error("❌ Redis connection error:", err);
						});

						return Redis.client;
					} catch (error) {
						console.error(`❌ Error connecting to Redis (Attempt ${attempt + 1}):`, error);
						attempt++;
						if (attempt < retryAttempts) {
							console.log(`Retrying... (${attempt}/${retryAttempts})`);
							await new Promise((resolve) => setTimeout(resolve, 2000)); // Retry delay of 3 second
						} else {
							throw new Error("Failed to connect to Redis after multiple attempts");
						}
					}
				}
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
