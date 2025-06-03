import path from "node:path";
import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const WorkerContainer = () => {
	const init = async () => {
		try {
			// When running inside the Docker container, after the build step:
			// 1. The current working directory (WORKDIR) is /app/apps/workers.
			// 2. The main script being run is ./build/index.js.
			// 3. Therefore, __dirname for this script will be /app/apps/workers/build.
			//
			// We expect the individual compiled worker modules (e.g., worker1/index.js)
			// to be located directly within this 'build' directory.
			const workersCompiledBasePath = __dirname; // This will resolve to /app/apps/workers/build

			// Read the contents of the 'build' directory to find worker subdirectories
			const entries = await readdir(workersCompiledBasePath, { withFileTypes: true });
			const folders = entries.filter((entry) => entry.isDirectory());

			await Promise.all(
				folders.map(async (folder) => {
					// Construct the path to the *compiled JavaScript* worker file
					// It should be 'index.js', not 'index.ts'
					const workerJsPath = path.join(workersCompiledBasePath, folder.name, "index.js");
					await import(workerJsPath);
				}),
			);
			return true;
		} catch (error) {
			console.log("❌ Failed to init workers: ", error);
			throw error;
		}
	};

	return { init };
};
