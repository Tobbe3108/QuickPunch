import { writable, type Writable } from 'svelte/store';
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

// Svelte store factory with IndexedDB persistence
export function persistentStore<T>(key: string, initial: T): Writable<T> {
	const store = writable<T>(initial);

	// Only run persistence logic in browser
	if (typeof window !== 'undefined') {
		// Load from IndexedDB on init
		idb.get<T>(key).then((value) => {
			if (value !== undefined) store.set(value);
		});

		// Subscribe to changes and persist
		store.subscribe((value: T) => {
			idb.set<T>(key, value);
		});
	}

	return store;
}
