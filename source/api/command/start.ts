import type { Context } from "grammy";
import { Command } from "../Telegram";
import User from "../User";
import registrationButton from "../button/registrationButton";
import viewOwnProfileButton from "../button/viewOwnProfileButton";

export async function registerGate (context: Context) {
	const userData = await User.read(context.from!.id!);
	if (userData) return userData;
	await context.reply("You are not registered!");
	return;
}

export default new Command("start", async context => {
	const userData = await User.read(context.from!.id!);
	context.replyWithRichMessage({
		html: `<b>Welcome to Teleconomy</b>
		<hr/>
Teleconomy is a real-time multiplayer player-driven economy simulation.<br/>
<br/>
${!userData ? "You are not yet registered. To do so, you have to press the button below." : "Welcome back, here are some some quick places to check:"}`
	}, {
		reply_markup: {
			inline_keyboard: !userData ? [[registrationButton]] : [[viewOwnProfileButton]]
		}
	});
});
