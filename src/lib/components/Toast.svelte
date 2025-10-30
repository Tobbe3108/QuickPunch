<script lang="ts">
	import { onMount } from 'svelte';
	export let toast: string;
	export let duration = 2500;
	export let onClose: (() => void) | undefined;

	let visible = true;

	onMount(() => {
		const id = setTimeout(() => {
			visible = false;
			onClose?.();
		}, duration);
		return () => clearTimeout(id);
	});
</script>

{#if visible}
	<div
		role="status"
		aria-live="polite"
		class="max-w-xs rounded bg-gray-900 px-3 py-2 text-sm text-white shadow"
	>
		{toast}
	</div>
{/if}
