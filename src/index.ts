import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";

import WithRouter from "./routes";
import systemLog from "./pkgs/systemLog";
import { tokenParser } from "./middlewares/auth.parser";
import { classifyError } from "./utils/transfrom";

const elysia = new Elysia({
	serve: {
		port: Bun.env.API_PORT,
	},
})
	.onError(({ code, error }) => {
		return new Response(error.toString(), { status: classifyError(code) });
	})
	.get("/", () => {
		throw new Error("Server is during maintainance");
	});

const App = elysia
	.use(
		cors({
			methods: ["GET", "POST", "PATCH", "DELETE"],
		})
	)
	.use(tokenParser);

const Server = WithRouter(App).listen(Bun.env.API_PORT);

systemLog.info(`🦊 Elysia is running at port ${Server.server!.port}`);
systemLog.info(`----------------------------------`);
