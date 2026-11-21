import { Button } from "../Telegram";
import { registerGate } from "../command/start";

export default new Button("My profile", "primary", "view-own-profile", async (context) => {
	const userData = await registerGate(context);
	if (!userData) return;
	await context.replyWithRichMessage({
		html: "<b>" + [context.from!.first_name, context.from!.last_name].join(" ") + "'s profile</b><hr/>"
			+ "Joined on: " + new Date(userData.registered).toISOString(),
	});
});
