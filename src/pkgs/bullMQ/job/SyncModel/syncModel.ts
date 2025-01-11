import type { Job } from "bullmq";
import { BaseJob } from "../../baseJob";
import type { JobImp } from "../../type";

export class SendWelcomeMail extends BaseJob implements JobImp {
	constructor(public payload: Record<string, unknown>) {
		super();
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	handle = (job?: Job<any, any, string> | undefined) => {
		// Send welcome mail
	};

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	failed = (job: Job<any, any, string>) => {
		console.error(`Job ${this.name} with ID: ${job.id} has failed.`);
	};
}
