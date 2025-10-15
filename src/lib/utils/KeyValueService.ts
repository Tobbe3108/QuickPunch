import { get, set, del, keys } from 'idb-keyval';

export type Keyed<T> = T & { key: string };

export const idb = {
	async get<T = unknown>(key: string): Promise<Keyed<T> | undefined> {
		const value = await get<T>(key);
		if (value === undefined) return undefined;
		return { ...(value as T), key };
	},
	async set<T = unknown>(value: Keyed<T>): Promise<void> {
		await set(value.key, value);
	},
	async del<T = unknown>(value: Keyed<T>): Promise<void> {
		await del(value.key);
	},
	async keys(): Promise<IDBValidKey[]> {
		return await keys();
	}
};
