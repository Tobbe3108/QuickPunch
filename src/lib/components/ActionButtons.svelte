<script lang="ts">
	let { availableActions, onWorkStart, onWorkStop, onLunchStart, onLunchEnd } = $props();
</script>

<div class="mb-4 flex flex-col gap-2">
	{#if availableActions()[0] === 'workStart'}
		<button class="btn-primary w-full" onclick={onWorkStart}>Start Work</button>
	{:else}
		<button class="btn-warning w-full" onclick={onWorkStop}>Stop Work</button>
	{/if}
	{#if availableActions().includes('lunchStart')}
		<button class="btn-primary w-full" onclick={onLunchStart}>Start Lunch</button>
	{/if}
	{#if availableActions().includes('lunchEnd')}
		<button class="btn-primary w-full" onclick={onLunchEnd}>End Lunch</button>
	{/if}
</div>
