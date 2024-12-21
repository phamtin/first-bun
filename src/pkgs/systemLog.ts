class Logger {
	logger: Console;
	transport: unknown;

	constructor() {
		this.logger = console;
	}

	info(args: unknown) {
		this.logger.log(args);
	}

	warn(args: unknown) {
		this.logger.log(args);
	}

	error(args: unknown) {
		this.logger.log(args);
	}
}

export default new Logger();
