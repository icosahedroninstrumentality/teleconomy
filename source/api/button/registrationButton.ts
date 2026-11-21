import { Button } from "../Telegram";
import User from "../User";

export default new Button("Register", "primary", "register", async (context) => {
	const userData = await User.read(context.from!.id!);
	if (userData) return context.reply("You are already registered!");
	await User.register(context.from!.id!);
	context.reply("You have been successfuly registered!");
});
