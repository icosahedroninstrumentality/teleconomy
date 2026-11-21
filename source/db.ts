import { file, type MaybePromise } from "bun";
import type { UUID } from "crypto";
import "fs"
import { mkdir } from "fs/promises";
import { homedir } from "os";
import { join } from "path";



export type Optional <T> = T | void;

export type Tuple <A, B> = [a: A, b: B];



export interface Store <K, V> {
	[Symbol.toStringTag]: string;
	get (key: K): MaybePromise<Optional<V>>;
	set (key: K, value: V): MaybePromise<this>;
	has (key: K): MaybePromise<boolean>;
	delete (key: K): MaybePromise<boolean>;
	clear (): MaybePromise<this>;
}

export interface TraversableStore <K, V> extends Store<K, V> {
	[Symbol.iterator](): MapIterator<[K, V]> | Iterator<[K, V]>;
	keys (): MaybePromise<K[]>;
	values (): MaybePromise<V[]>;
	entries (): MaybePromise<Tuple<K, V>[]>;
}



export class Cache <K extends string, V> implements TraversableStore<K, V> {
	[Symbol.iterator](): MapIterator<[K, V]> { return this.#data[Symbol.iterator](); }
	[Symbol.toStringTag] = `Cache`;
	
	#list = [] as K[];
	readonly #data = new Map<K, V>;

	constructor (public readonly limit: number) {
		if (limit < 1) throw new Error("Cache limit must be bigger than 0!")
	}

	#check (): void {
		if (this.#list.length <= this.limit) return;

		const toRemove = this.limit - this.#list.length;
		const extra = this.#list.slice(0, toRemove);
		this.#list = this.#list.slice(toRemove);
		extra.map(k => this.#data.delete(k));
	}

	public set (key: K, value: V) { this.#check(); this.#data.set(key, value); return this; }
	public get (key: K) { this.#check(); return this.#data.get(key); }
	public clear () { this.#data.clear(); return this; }
	public delete (key: K) { this.#check(); return this.#data.delete(key); }
	public entries () { return this.#data.entries().toArray(); }
	public forEach (callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any) { return this.#data.forEach(callbackfn, thisArg); }
	public getOrInsert (key: K, defaultValue: V) { return this.#data.getOrInsert(key, defaultValue); }
	public getOrInsertComputed (key: K, callback: (key: K) => V) { return this.#data.getOrInsertComputed(key, callback); }
	public has (key: K) { return this.#data.has(key); }
	public keys () { return this.#data.keys().toArray(); }
	public get size () { return this.#data.size; }
	public values () { return this.#data.values().toArray(); }
	public toString () { return `Cache[${this.size}]`; }
}



export class FSMap <K extends string, V> implements Store<K, V> {
	[Symbol.toStringTag] = `FSMap`;

	constructor (
		public readonly path: string,
		public readonly preSanitizedKeys: boolean = false,
	) {
		if (!path.startsWith(homedir())) console.error(`PATHS OUTSIDE THE HOME DIR SHOULD NEVER BE USED THIS SOFTWARE IS NOT PREDICTABLE`);
	}

	#toPath (key: K) {
		if (this.preSanitizedKeys) return join(this.path, key.toString()) + ".json";
		return join(this.path, Buffer.from(key.toString(), "utf-8").toString("hex")) + ".json";
	}
	//#fromPath (key: string) { return Buffer.from(key.slice(this.path.length, -".json".length), "hex").toString("utf-8") as K; }

	public async get (key: K) {
		const handle = file(this.#toPath(key));
		if (!await handle.exists()) return;
		return JSON.parse(await handle.text()) as V;
	}

	public async set (key: K, value: V) {
		const handle = file(this.#toPath(key));
		handle.write(JSON.stringify(value));
		return this;
	}

	public async clear () {
		const handle = file(this.path);
		await handle.delete();
		await mkdir(this.path);
		return this;
	}

	public async delete (key: K) {
		const handle = file(this.#toPath(key));
		const pre = await handle.exists();
		await handle.delete();
		return pre;
	}

	public async has (key: K) {
		const handle = file(this.#toPath(key));
		return await handle.exists();
	}
}

export class Database <K extends string = UUID, V extends any = unknown> implements Store<K, V> {
	[Symbol.toStringTag] = `Database`;
	
	constructor (
		public readonly path: string,
		public readonly preSanitizedKeys: boolean = true,
		public readonly cacheLimit: number = 1024,
		private readonly cache = new Cache<K, V>(cacheLimit),
		private readonly fs = new FSMap<K, V>(path, preSanitizedKeys),
	) {
		console.warn("Registered a DB at:", path);
		if (!path) throw new Error("Missing path for DB!");
		if (!path.startsWith(homedir())) throw new Error(`PATHS OUTSIDE THE HOME DIR SHOULD NEVER BE USED THIS SOFTWARE IS NOT PREDICTABLE`);
		(async()=>{
			await mkdir(path, {recursive: true});
			this.#readySignal();
		})();
	}

	#readySignal!: () => void;
	public ready = new Promise<void>(res => this.#readySignal = res);

	public async clear () {
		await this.cache.clear();
		await this.fs.clear();
		return this;
	}

	public async set (key: K, value: V) {
		await this.cache.set(key, value);
		await this.fs.set(key, value);
		return this;
	}

	public async get (key: K) {
		return (await this.cache.get(key)) ?? (await this.fs.get(key));
	}

	public async has (key: K) {
		if (await this.cache.has(key)) return true;
		return await this.fs.has(key);
	}

	public async delete (key: K) {
		return (await this.cache.delete(key)) || (await this.fs.delete(key));
	}
}
