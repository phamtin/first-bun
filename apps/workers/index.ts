// import { WorkerContainer } from "./init";
// import { connectToRedis } from "@/shared/loaders/redis";
// import { Hono } from "hono";
// import { cors } from "hono/cors";
// import { closeMongoConnection, connectToDatabase } from "../shared/loaders/mongo";
// import { closeRedisConnection } from "../shared/loaders/redis";
// import { handleError } from "../shared/utils/error";
// import { validateEnv } from "../shared/utils/validate";
import { initNatConsumer } from "./init-nats";

// validateEnv();

// process.on("SIGINT", () => {
// 	console.log("[SIGINT] Shutting down..");
// 	closeMongoConnection();
// 	closeRedisConnection();
// 	process.exit();
// });

// const HonoApp = new Hono();

// HonoApp.use("/*", cors());

// HonoApp.onError(handleError);

// await connectToDatabase();
// await connectToRedis();
// initNatConsumer();

// export default {
// 	port: 8001,
// 	fetch: HonoApp.fetch,
// };

(() => {
	// WorkerContainer()
	// 	.init()
	// 	.then(async (isSuccess) => {
	// 		if (isSuccess) {
	// 			const redis = (await connectToRedis()) as IoRedis;
	// 			redis.set("ping", "pong").then(() => {
	// 				redis.del("ping");
	// 				console.log("- Initialized workers");
	// 			});
	// 		}
	// 	})
	// 	.catch((err) => {
	// 		console.error("Failed to initialize worker:", err);
	// 		process.exit(1);
	// 	});
	initNatConsumer();
})();
