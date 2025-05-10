import path from "node:path";
import { readdir } from "node:fs/promises";

export const WorkerContainer = () => {
	const init = async () => {
		try {
			const workersBasePath = path.join(__dirname, "../workers");
			const entries = await readdir(workersBasePath, { withFileTypes: true });
			const folders = entries.filter((entry) => entry.isDirectory());

			await Promise.all(
				folders.map(async (folder) => {
					const workerPath = `${workersBasePath}/${folder.name}/index.ts`;
					await import(workerPath);
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
