import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { closeMongoConnection, connectToDatabase } from "./loaders/mongo";
import { closeRedisConnection, connectToRedis } from "./loaders/redis";
import { handleError } from "./utils/error";
import routes from "./routes";
import { validateEnv } from "./utils/validate";

validateEnv();

process.on("SIGINT", () => {
	console.log("[SIGINT] Shutting down...");
	closeMongoConnection();
	closeRedisConnection();
	process.exit(1);
});

const HonoApp = new Hono();

HonoApp.use(logger());

HonoApp.use("/*", cors());

HonoApp.use("*", (c, next) => {
	c.set("userAgent" as never, c.req.header("User-Agent"));
	return next();
});

HonoApp.get("/ping", (c) => {
	return c.json({ pong: "It works like a fucking charm!" });
});

HonoApp.route("/", routes);

HonoApp.onError(handleError);

await connectToDatabase();
await connectToRedis();

//	init bullMQ
import("@/pkgs/bullMQ/worker/SyncModel.worker")
	.then(() => {
		console.log("✅ Worker initialized");
	})
	.catch((e) => {
		console.log("❌ Worker failed to initialize", e);
	});

export default {
	port: 8000,
	fetch: HonoApp.fetch,
};
