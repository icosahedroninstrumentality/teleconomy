import { Bot } from "grammy";
import { Config } from "./config";
import Telegram from "./api/Telegram";

export const bot = new Bot(Config.telegram);

setInterval(() => {
	bot.api.setMyCommands([
		{ command: "start",  description: "Main bot menu" },
		{ command: "me",  description: "Shortcut to your profile" },
		{ command: "market",  description: "Shortcut to the market" },
		{ command: "help",  description: "Help menu" },
	]);
}, 60*1000);

bot.on("message", context => Telegram.inbox(bot, context));
bot.on("callback_query:data", context => Telegram.callback(bot, context));
