import type IoRedis from "ioredis";
import type { ExtendTaskModel, TaskModel } from "../../database/model/task/task.model";
import Redis, { connectToRedis } from "@/loaders/redis";

/**
 *  Cache full extended task
 */
class TaskCache {
	private instance: IoRedis = null as unknown as IoRedis;
	private DEFAULT_EXPIRED_IN: number;
	private PREFIX = "Task_";

	constructor() {
		const ONE_MINUTE = 60;
		this.DEFAULT_EXPIRED_IN = ONE_MINUTE;
		this.connectToRedisClient();
	}

	private async connectToRedisClient(): Promise<void> {
		this.instance = (await connectToRedis()) as IoRedis;
	}

	async addTask(payload: TaskModel & ExtendTaskModel) {
		if (!payload._id) return;

		const key = this.PREFIX + payload._id;

		this.instance.set(key, JSON.stringify(payload), "EX", this.DEFAULT_EXPIRED_IN);
	}

	async getTaskById() {}

	async removeTaskById() {}

	async clearAllTasks() {}
}

export default TaskCache;
