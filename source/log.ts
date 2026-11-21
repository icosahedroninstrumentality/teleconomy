import { file } from "bun";
import { join } from "node:path";
import { Config } from "./config";
import { format } from "node:util";

export const isoTime = () => new Date().toISOString();

const logFile = file(join(Config.logs, isoTime()+".log")).writer();

export class Log {
	constructor (
		public readonly name: string,
	) {}

	private write (type: string, message: string) {
		logFile.write(`[${isoTime()} ${this.name}] ${type}:${message}\n`);
	}

	public info     (message: string, ...data: any[]) { if (Config.loglevel === "info") this.write("INFO", format("", message, ...data))};
	public warning  (message: string, ...data: any[]) { this.write("WARNING", format("", message, ...data))};
	public error    (message: string, ...data: any[]) { this.write("ERROR", format("", message, ...data))};
}

