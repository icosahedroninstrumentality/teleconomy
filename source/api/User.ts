import { Api } from "../api";
import { Language } from "./Telegram";

export interface UserSettings {
	registered: number;
	language: Language;
	notifications: boolean;
}

export default new Api<string, UserSettings>("Settings")
.endpoint("register", async (api, db, log, username: string) => {
	db.set(username, {
		language: Language.English,
		notifications: false, // be nice to users
		registered: Date.now(),
	})
})
.endpoint("delete", async (api, db, log, username: string) => {})
.endpoint("read", async (api, db, log, username: string) => {})
.endpoint("export", async (api, db, log, username: string) => {})
;
