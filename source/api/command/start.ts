import type { Context } from "grammy";
import { Button, Command } from "../Telegram";
import User from "../User";

export const registrationButton = new Button("Register", "primary", "register", async context => {
	const userData = await User.read(context.from!.id!);
	if (userData) return context.reply("You are already registered!");
	await User.register(context.from!.id!);
	context.reply("You have been successfuly registered!");
});

export async function registerGate (context: Context) {
	const userData = await User.read(context.from!.id!);
	if (userData) return userData;
	await context.reply("You are not registered!");
	return;
}

export const viewOwnProfileButton = new Button("My profile", "primary", "view-own-profile", async context => {
	const userData = await registerGate(context);
	if (!userData) return;
	await context.replyWithRichMessage({
		html: "<b>"+[context.from!.first_name, context.from!.last_name].join(" ")+"'s profile</b><hr/>"
		+ "Joined on: "+new Date(userData.registered).toISOString(),
	});
});


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
