import { existsSync } from "node:fs";

export function validateEnv() {
	const envFilePath = "./.env";

	if (!existsSync(envFilePath)) {
		console.error(`Error: .env file is missing at ${envFilePath}`);
		process.exit(1);
	}
}

export const ALLOWED_DOMAINS: { [key: string]: boolean } = {
	localhost: true,
	"127.0.0.1": true,
};
