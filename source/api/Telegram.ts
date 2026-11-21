import type { Bot, Context } from "grammy";
import { Api } from "../api";
import type { PathLike } from "bun";

export interface Page {
	title?: string;
	description?: string;
	media?: PathLike;
	shortcuts?: Command[];
	buttons?: Button[];
}

export class Command {}

export class Button {}

export enum Language {
	English = "en",
	Hungarian = "hu",
	Slovak = "sk",
	French = "fr",
}

export type Translated = Record<Language, string>;

export default new Api("Telegram")
.endpoint("inbox", async (api, db, log, bot: Bot, message: Context) => {
	message.reply("test")
})
;
