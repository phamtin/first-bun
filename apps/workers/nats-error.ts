import { type JsMsg, StringCodec } from "nats";
import type { PublishMessage } from "@/api/init-nats";
import type { Context } from "@/shared/types/app.type";
import AccountWorker from "./modules/Accounts/account.worker";
import FolderWorker from "./modules/Folders/folder.worker";
import NotificationWorker from "./modules/Notification/noti.worker";
import SyncWorker from "./modules/Sync/sync.worker";
import TaskWorker from "./modules/Tasks/task.worker";
import SchedulerWorker from "./Scheduler/scheduler.worker";

interface JsMsgMetadata {
	messageId: string;
	subject: string;
	deliveryCount: number;
	timestamp: number;
}

interface RetryConfig {
	maxRetries: number;
}

enum ErrorType {
	TRANSIENT = "TRANSIENT", // retry
	SYSTEM = "SYSTEM", // retry
	BUSINESS_LOGIC = "BUSINESS_LOGIC", // no retry
	POISON = "POISON", // no retry
}

interface ProcessingError extends Error {
	type: ErrorType;
	retryable: boolean;
	metadata?: Record<string, any>;
}

class MessageProcessor {
	private readonly retryConfig: RetryConfig = {
		maxRetries: 5,
	};

	private readonly stringCodec = StringCodec();
	private readonly activeMessages = new Set<string>();

	async processMessage(message: JsMsg): Promise<void> {
		const metadata = this.extractMessageMetadata(message);
		this.activeMessages.add(metadata.messageId);

		try {
			await this.processWithTimeout(message, this.parsePublishMessage(message));
			message.ack();
			console.log(`ack-ed subject=${metadata.subject} messageId=${metadata.messageId}`);
		} catch (error) {
			await this.handleProcessingError(message, error as ProcessingError, metadata);
		} finally {
			this.activeMessages.delete(metadata.messageId);
		}
	}

	private extractMessageMetadata(message: JsMsg): JsMsgMetadata {
		if (!message.headers) throw new Error("Message headers not found");

		return {
			messageId: message.headers.get("Nats-Msg-Id"),
			deliveryCount: Number.parseInt(message.headers.get("Nats-Delivery-Count") || "1"),
			timestamp: Date.now(),
			subject: message.subject,
		};
	}

	private parsePublishMessage(message: JsMsg): PublishMessage {
		try {
			return JSON.parse(this.stringCodec.decode(message.data));
		} catch (error) {
			throw this.createError(ErrorType.POISON, "Invalid Message", false, { parseError: (error as Error).message });
		}
	}

	private async processWithTimeout(jsMsg: JsMsg, messageData: PublishMessage): Promise<void> {
		const timeoutMs = 30000; // 30 second timeout

		const timeoutPromise = new Promise<never>((_, reject) => {
			setTimeout(() => {
				return reject(this.createError(ErrorType.TRANSIENT, "Message processing timeout", true));
			}, timeoutMs);
		});

		return await Promise.race([this.process(jsMsg, messageData), timeoutPromise]);
	}

	private async process(jsMsg: JsMsg, messageData: PublishMessage): Promise<void> {
		const ctx: Context = messageData.ctx;
		if (!ctx) throw new Error("Missing message context");

		console.log(`processing subject=${messageData.subject} messageId=${messageData.messageId}`);
		try {
			if (messageData.subject.startsWith("events.sync_model")) {
				await SyncWorker(messageData);
			}
			if (messageData.subject.startsWith("events.accounts.")) {
				await AccountWorker(messageData);
			}
			if (messageData.subject.startsWith("events.folders.")) {
				await FolderWorker(messageData);
			}
			if (messageData.subject.startsWith("events.tasks.")) {
				await TaskWorker(messageData);
			}
			if (messageData.subject.startsWith("events.notifications.")) {
				await NotificationWorker(jsMsg, messageData);
			}
			if (messageData.subject.startsWith("events.scheduled.")) {
				await SchedulerWorker(jsMsg, messageData);
			}
		} catch (error) {
			throw this.classifyError(error as Error);
		}
	}

	private async handleProcessingError(message: JsMsg, error: ProcessingError, metadata: JsMsgMetadata): Promise<void> {
		switch (error.type) {
			case ErrorType.TRANSIENT:
				await this.handleTransientError(message, error, metadata);
				break;

			case ErrorType.BUSINESS_LOGIC:
				await this.handleBusinessLogicError(message, error, metadata);
				break;

			case ErrorType.POISON:
				await this.handlePoisonMessage(message, error, metadata);
				break;

			case ErrorType.SYSTEM:
				await this.handleSystemError(message, error, metadata);
				break;
			default:
				await this.handleSystemError(message, error, metadata);
				break;
		}
	}

	private async handleTransientError(message: JsMsg, error: ProcessingError, metadata: JsMsgMetadata): Promise<void> {
		if (metadata.deliveryCount < this.retryConfig.maxRetries) {
			// NAK with delay for exponential backoff
			message.nak();
		} else {
			message.ack(); // ACK to prevent further redelivery
			console.log("[TRANSIENT ERROR] Max retries exceeded, sending to DLQ", {
				messageId: metadata.messageId,
				attempts: metadata.deliveryCount,
			});

			await this.sendToDeadLetterQueue(message, error, metadata);
		}
	}

	private async handleBusinessLogicError(message: JsMsg, error: ProcessingError, metadata: JsMsgMetadata): Promise<void> {
		console.log("[BUSINESS ERROR] Sending to DLQ for manual review", {
			messageId: metadata.messageId,
			error: error.message,
		});

		await this.sendToDeadLetterQueue(message, error, metadata);
		message.ack(); // ACK to prevent redelivery
	}

	private async handlePoisonMessage(message: JsMsg, error: ProcessingError, metadata: JsMsgMetadata): Promise<void> {
		console.log("[POISON MESSAGE] Discarding malformed message", {
			messageId: metadata.messageId,
			error: error.message,
		});

		await this.sendToDeadLetterQueue(message, error, metadata);
		message.ack(); // ACK to prevent redelivery
	}

	private async handleSystemError(message: JsMsg, error: ProcessingError, metadata: JsMsgMetadata): Promise<void> {
		if (metadata.deliveryCount <= 2) {
			const delay = 5000;
			console.log("[SYSTEM ERROR] Limited retry for potential code issue", {
				messageId: metadata.messageId,
				attempt: metadata.deliveryCount,
				error: error.message,
			});

			message.nak(delay);
		} else {
			console.error("[SYSTEM ERROR] Critical system error - alerting and sending to DLQ", {
				messageId: metadata.messageId,
				error: error.message,
				stack: error.stack,
			});

			await this.sendToDeadLetterQueue(message, error, metadata);
			message.ack();
		}
	}

	private classifyError(error: Error): ProcessingError {
		const message = error.message.toLowerCase();

		if (message.includes("timeout") || message.includes("network") || message.includes("connection")) {
			return this.createError(ErrorType.TRANSIENT, error.message, true);
		}

		if (message.includes("validation") || message.includes("invalid") || message.includes("required")) {
			return this.createError(ErrorType.BUSINESS_LOGIC, error.message, false);
		}

		if (message.includes("parse") || message.includes("json") || message.includes("format")) {
			return this.createError(ErrorType.POISON, error.message, false);
		}

		return this.createError(ErrorType.SYSTEM, error.message, false);
	}

	private createError(type: ErrorType, message: string, retryable: boolean, metadata?: Record<string, any>): ProcessingError {
		const error = new Error(message) as ProcessingError;
		error.type = type;
		error.retryable = retryable;
		error.metadata = metadata;
		return error;
	}

	private async sendToDeadLetterQueue(message: JsMsg, error: ProcessingError, metadata: JsMsgMetadata): Promise<void> {
		try {
			const dlqPayload = {
				originalMessage: {
					subject: message.subject,
					data: this.stringCodec.decode(message.data),
					headers: message.headers,
				},
				error: {
					type: error.type,
					message: error.message,
					stack: error.stack,
					metadata: error.metadata,
				},
				processingMetadata: metadata,
				timestamp: new Date().toISOString(),
			};
			console.log("we're lost!, pushing to DLQ", `dlq.${message.subject}`, dlqPayload);
		} catch (dlqError) {
			console.error("[DLQ ERROR] Failed to send message to DLQ", {
				messageId: metadata.messageId,
				dlqError: (dlqError as Error).message,
			});
		}
	}
}

export default MessageProcessor;
