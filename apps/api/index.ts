import { Hono } from "hono";
import { cors } from "hono/cors";

import { closeMongoConnection, connectToDatabase } from "../shared/loaders/mongo";
import { closeRedisConnection, connectToRedis } from "../shared/loaders/redis";
import { handleError } from "../shared/utils/error";
import routes from "./routes";
import { validateEnv } from "../shared/utils/validate";
import { initBullMQ } from "../shared/services/bullMQ/init";

validateEnv();

process.on("SIGINT", () => {
	console.log("[SIGINT] Shutting down..");
	closeMongoConnection();
	closeRedisConnection();
	process.exit();
});

const HonoApp = new Hono();

HonoApp.use("/*", cors());

HonoApp.route("/", routes);

HonoApp.onError(handleError);

await connectToDatabase();
await connectToRedis();
await initBullMQ();

export default {
	port: 8000,
	fetch: HonoApp.fetch,
};

export { HonoApp }; // Should not export this, but For testing only
