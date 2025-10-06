import { get, set, del, keys } from 'idb-keyval';

export const idb = {
	async get<T = unknown>(key: string): Promise<T | undefined> {
		return await get(key);
	},
	async set<T = unknown>(key: string, value: T): Promise<void> {
		await set(key, value);
	},
	async del(key: string): Promise<void> {
		await del(key);
	},
	async keys(): Promise<IDBValidKey[]> {
		return await keys();
	}
};
