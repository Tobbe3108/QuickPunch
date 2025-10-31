import { toast as sonnerToast } from 'svelte-sonner';

/**
 * Unified toast API using svelte-sonner.
 * Replaces custom toast store with Sonner's toast() function.
 */
export const toasts = {
	push(text: string) {
		return sonnerToast(text);
	}
};

export default toasts;
