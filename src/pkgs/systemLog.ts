import pino, { BaseLogger } from "pino";

const isProd = process.env.BUN_ENV === "prod";

class Logger {
	logger: Console;
	transport: any;

	constructor() {
		this.logger = console;
	}

	info(args: any) {
		this.logger.log(args);
	}

	warn(args: any) {
		this.logger.log(args);
	}

	error(args: any) {
		this.logger.log(args);
	}
}
class LoggerProd {
	logger: BaseLogger;
	transport: any;

	constructor() {
		this.logger = pino();
	}

	info(args: any) {
		this.logger.info(args);
	}

	warn(args: any) {
		this.logger.warn(args);
	}

	error(args: any) {
		this.logger.error(args);
	}
}

export default isProd ? new LoggerProd() : new Logger();
