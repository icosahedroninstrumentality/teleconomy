import type { Bot, Context } from "grammy";
import { Api } from "../api";
import type { PathLike } from "bun";
import { join } from "node:path";
import { readdir } from "node:fs/promises";
import type { Message } from "grammy/types";
import { randomID, type ID } from "../identity";

export class Button {
	public static readonly registered = new Map<string, Button>();

	constructor (
		public readonly text: string,
		public readonly style: "danger" | "success" | "primary" | undefined,
		public readonly callback_data: string,
		public readonly handler: (context: Context) => Promise<any>,
	) {
		Button.registered.set(callback_data, this);
	}
}

export class Command {
	public static readonly registered = new Map<string, Command>();

	constructor (
		public readonly name: string,
		public readonly handler: (context: Context) => Promise<any>,
	) {
		Command.registered.set(name, this);
	}
}

await Promise.all(
	(await readdir(join(__dirname, "command")))
	.map(file => import(join(__dirname, "command", file!)))
);

export enum Language {
	English = "en",
	Hungarian = "hu",
	Slovak = "sk",
	French = "fr",
}

export type Translated = Record<Language, string>;

export default new Api("Telegram")
.endpoint("inbox", async (api, db, log, bot: Bot, context: Context) => {
	if (context.from!.is_bot) return;
	for (let [name, command] of Command.registered) {
		if (context.hasCommand(name)) command.handler(context);
	}
})
.endpoint("callback", async (api, db, log, bot: Bot, context: Context) => {
	if (context.from!.is_bot) return;
	for (let [callback_data, button] of Button.registered) {
		if (context.hasCallbackQuery(callback_data)) button.handler(context);
	}
})
;
