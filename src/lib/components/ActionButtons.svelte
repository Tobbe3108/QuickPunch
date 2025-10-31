<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	let { availableActions, onWorkStart, onWorkStop, onLunchStart, onLunchEnd } = $props();
</script>

<div class="mb-4 flex flex-col gap-2">
	{#if availableActions()[0] === 'workStart'}
		<Button class="w-full" onclick={onWorkStart}>Start Work</Button>
	{:else}
		<Button class="w-full" variant="destructive" onclick={onWorkStop}>Stop Work</Button>
	{/if}
	{#if availableActions().includes('lunchStart')}
		<Button class="w-full" onclick={onLunchStart}>Start Lunch</Button>
	{/if}
	{#if availableActions().includes('lunchEnd')}
		<Button class="w-full" onclick={onLunchEnd}>End Lunch</Button>
	{/if}
</div>
