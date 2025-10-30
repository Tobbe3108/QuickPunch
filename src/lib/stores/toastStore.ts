import { writable } from 'svelte/store';

export type ToastItem = { id: number; text: string };

const { subscribe, update } = writable<ToastItem[]>([]);

let nextId = 1;

export const toasts = {
	subscribe,
	push(text: string) {
		const id = nextId++;
		update((s) => [...s, { id, text }]);
		return id;
	},
	remove(id: number) {
		update((s) => s.filter((t) => t.id !== id));
	}
};

export default toasts;
