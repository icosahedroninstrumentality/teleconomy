import { randomUUID, type UUID, type webcrypto } from "node:crypto";

export type ID = UUID & {};
export const randomID = () => randomUUID() as ID;
export type Key = webcrypto.JsonWebKey;
export type SharedKey = webcrypto.CryptoKey;

export class Identity {
	/**
	 * @returns A new `Identity` with a cryptographically secure random key.
	 */
	public static async create (): Promise<Identity> {
		return new Identity(await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]));
	}
	
	/**
	 * This function creates a new `Identity` with a previously generated key. To get the key of an `Identity`, use {@link Identity.privateKey}.
	 * 
	 * @param data JWK of the full key
	 * @returns A new `Identity` with a pre-existing key.
	 */
	public static async load (data: Key): Promise<Identity> {
		const publicKey  = await crypto.subtle.importKey("jwk", { kty: data.kty, crv: data.crv, x: data.x, y: data.y }, { name: "ECDH", namedCurve: "P-256" }, true, []);
		const privateKey = await crypto.subtle.importKey("jwk", data, { name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"],);
		return new Identity({ publicKey, privateKey });
	}
	
	private constructor (private keypair: webcrypto.CryptoKeyPair) {}
	
	/**
	 * @returns JWK of the public key
	 */
	public async publicKey (): Promise<Key> {
		return await crypto.subtle.exportKey("jwk", this.keypair.publicKey);
	}
	
	/**
	 * ### This function will export your whole key keep it safe and secure.
	 * 
	 * @returns JWK OF THE FULL IDENTITY KEY
	 */
	public async privateKey (): Promise<Key> {
		return await crypto.subtle.exportKey("jwk", this.keypair.privateKey);
	}
	
	/**
	 * ### Warning just in case: This is sensitive, keep it secure
	 * 
	 * @param publicKey Public key of the peer `Identity`.
	 * @returns A shared key that can be used to encrypt and decrypt data.
	 */
	public async sharedKey (publicKey: Key): Promise<SharedKey> {
		const peer = await crypto.subtle.importKey("jwk", publicKey, { name: "ECDH", namedCurve: "P-256" }, false, []);
		return await crypto.subtle.importKey("raw", await crypto.subtle.deriveBits({ name: "ECDH", public: peer }, this.keypair.privateKey, 256), { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
	}

	/**
	 * Encrypt any arbitriary data with a shared key. Keep in mind that serialization is made by `JSON.stringify`, which will throw on circular references!
	 * 
	 * In case you want to avoid `JSON.stringify`, you can pass a custom serializer.
	 * 
	 * @param sharedKey Shared key between two identities
	 * @param data Any arbitriary data
	 * @param serializer Custom serializer
	 * @returns Encrypted UInt8Array of the data
	 */
	public async encrypt <T> (sharedKey: SharedKey, data: T, serializer?: (data: T) => ArrayBuffer): Promise<Uint8Array<ArrayBuffer>> {
		const encoded = !serializer ? new TextEncoder().encode(JSON.stringify(data)) : serializer(data);
		const iv = crypto.getRandomValues(new Uint8Array(12));
		const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, sharedKey, encoded));
		const out = new Uint8Array(iv.length + ct.length);
		out.set(iv, 0);
		out.set(ct, iv.length);
		return out;
	}
	
	/**
	 * Decrypt any buffer with a shared key. Keep in mind that this function uses `JSON.parse` and if the `validator` returns `false`, the decrypt function will throw!
	 * 
	 * In case you want to avoid `JSON.parse`, you can pass a custom serializer.
	 * 
	 * @param sharedKey Shared key between two identities
	 * @param data Raw data in any buffer representation
	 * @param validator An optional validation function to make explicity runtime checks
	 * @param deserializer Custom deserializer of the decrypted bytes
	 * @returns A type safe decrypted value
	 */
	public async decrypt <T> (
		sharedKey: SharedKey,
		data: ArrayBuffer | Buffer | Uint8Array,
		validator?: (result: T) => boolean | Promise<boolean>,
		deserializer?: (data: ArrayBuffer) => T,
	): Promise<T> {
		const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
		const iv = bytes.slice(0, 12);
		const ct = bytes.slice(12);
		const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, sharedKey, ct);
		const result = !deserializer ? JSON.parse(new TextDecoder().decode(pt)) as T : deserializer(pt);
		if (validator) if (!(await validator(result))) throw new Error("ValidationError");
		return result;
	}
}
