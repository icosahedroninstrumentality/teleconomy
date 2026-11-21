import { env } from "bun";

class ConfigError extends Error {}

function getEnv (code: string, label: string, required: boolean = true) {
	const data = env[code];
	if (required && typeof data === "undefined") throw new ConfigError(`${label} is not configured! Please set field \`${code}\` environment variable!`);
	return data;
}

export namespace Config {
	export const database = getEnv("DATABASE","Database directory path")!;
	export const logs = getEnv("LOGS","Logs directory path")!;
	export const telegram = getEnv("TELEGRAM","Telegram bot token")!;
	export const loglevel = getEnv("LOGLEVEL","Logging level") ?? "info";
}
