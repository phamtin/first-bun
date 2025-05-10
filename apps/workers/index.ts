import { WorkerContainer } from "./init";
import { connectToRedis } from "@/shared/loaders/redis";
import type IoRedis from "ioredis";
(() => {
	WorkerContainer()
		.init()
		.then(async (isSuccess) => {
			if (isSuccess) {
				const redis = (await connectToRedis()) as IoRedis;

				redis.set("ping", "pong").then(() => {
					redis.del("ping");
					console.log("- Initialized workers");
				});
			}
		})
		.catch((err) => {
			console.error("Failed to initialize worker:", err);
			process.exit(1);
		});
})();
