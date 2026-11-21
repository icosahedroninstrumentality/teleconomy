import { dirname, join } from "node:path";
import { Database } from "./db";

export type Handler<In extends any[], Out> = (...data: In) => Promise<Out>;

export class Api <K extends string, V> {
	public static readonly registered = new Map<string, Api<any, any>>();

	constructor(
		public readonly name: string,
		private readonly safeKeys: boolean = true,
		public readonly db = new Database<K, V>(join(dirname(__dirname), "data", name), safeKeys),
	) {}

	endpoint<N extends string, In extends any[], Out>(
		name: N,
		handler: (api: this, db: Database<K, V>, ...data: In) => Promise<Out>,
	) {
		(this as any)[name] = (...data: In) => handler(this, this.db, ...data);
		Api.registered.set(name, this);
		return this as this & { [P in N]: Handler<In, Out> };
	}
}
