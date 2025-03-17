import type IoRedis from "ioredis";
import type { ObjectId } from "mongodb";
import { connectToRedis } from "@/loaders/redis";
import type { AccountModel } from "../../database/model/account/account.model";

/**
 * Cache User session
 */
class AccountCache {
	private instance: IoRedis = null as unknown as IoRedis;
	private readonly DEFAULT_EXPIRED_IN: number;
	private readonly PREFIX = "Account_";

	constructor() {
		this.DEFAULT_EXPIRED_IN = 60 * 60 * 24; // 1 day in seconds
		this.connectToRedisClient();
	}

	private async connectToRedisClient(): Promise<void> {
		this.instance = (await connectToRedis()) as IoRedis;
	}

	async addAccountSession(payload: AccountModel["profileInfo"] & { _id: ObjectId; token: string }): Promise<string | undefined> {
		if (!payload._id || !payload.token) {
			return;
		}
		try {
			const key = `${this.PREFIX}${payload._id}_${payload.token}`;
			return await this.instance.set(key, JSON.stringify(payload), "EX", this.DEFAULT_EXPIRED_IN);
		} catch (error) {
			console.error("[ERROR] addAccountSession:", error);
		}
	}

	async getAccountSessionById(accountId: string, token: string): Promise<(AccountModel["profileInfo"] & { _id: ObjectId; token: string }) | null> {
		try {
			const key = `${this.PREFIX}${accountId}_${token}`;
			const sessionToken = await this.instance.get(key);
			return sessionToken ? JSON.parse(sessionToken) : null;
		} catch (e) {
			return null;
		}
	}

	async removeSessionByAccountId(accountId: string): Promise<void> {
		try {
			const pattern = `${this.PREFIX}${accountId}_*`;
			let cursor = "0";
			const keys = [];
			do {
				const result = await this.instance.scan(cursor, "MATCH", pattern);
				cursor = result[0];
				keys.push(...result[1]);
			} while (cursor !== "0");

			if (keys.length > 0) {
				await this.instance.del(...keys);
			}
		} catch (error) {
			console.error("[ERROR] removeSessionByAccountId:", error);
		}
	}
}

export default new AccountCache();
