import { Api } from "../api";
import { Language } from "./Telegram";

export interface UserSettings {
	registered: number;
	language: Language;
	notifications: boolean;
}

export default new Api<string, UserSettings>("Settings")
.endpoint("register", async (api, db, log, id: number) => {
	await db.set(id.toString(), {
		language: Language.English,
		notifications: false, // be nice to users
		registered: Date.now(),
	})
})
.endpoint("delete", async (api, db, log, id: number) => {
	return await db.delete(id.toString());
})
.endpoint("read", async (api, db, log, id: number) => {
	return await db.get(id.toString());
})
.endpoint("export", async (api, db, log, id: number) => {})
;
