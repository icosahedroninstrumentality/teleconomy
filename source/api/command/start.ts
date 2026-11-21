import { Button, Command } from "../Telegram";
import User from "../User";

export const registrationButton = new Button("Register", "primary", "register", async context => {
	const userData = await User.read(context.from!.username!);
	if (userData) return context.reply("You are already registered!");
	await User.register(context.from!.username!);
	context.reply("You have been successfuly registered!");
});

export default new Command("start", async context => {
	const userData = await User.read(context.from!.username!);
	context.replyWithRichMessage({
		html: `<b>Welcome to Teleconomy</b>
		<hr/>
Teleconomy is a real-time multiplayer player-driven economy simulation.<br/>
<br/>
${!userData ? "You are not yet registered. To do so, you have to press the button below." : "Welcome back, here are some some quick places to check:"}`
	}, {
		reply_markup: {
			inline_keyboard: !userData ? [[registrationButton]] : [[]]
		}
	});
});
