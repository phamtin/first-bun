import { existsSync } from "node:fs";

export function validateEnv() {
	const envFilePath = "../../.env";

	if (!existsSync(envFilePath)) {
		console.error(`Error: .env file is missing at ${envFilePath}`);
		process.exit(1);
	}
}
