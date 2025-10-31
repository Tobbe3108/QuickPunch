<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	let { record, workDurations, workTime, fmtTime, onEdit, onDelete } = $props();

	const hasDurations = $derived(workDurations().length > 0);
	const lunchLabel = $derived(
		record.lunchDuration
			? `${fmtTime(record.lunchDuration.start)} - ${fmtTime(record.lunchDuration.end)}`
			: ''
	);
</script>

<div class="mt-6">
	<h2 class="mb-2 font-semibold">Today’s Times</h2>
	<ul class="space-y-1">
		{#each workDurations() as dur, i}
			<li class="flex items-center gap-2">
				<span>Work {i + 1}: {fmtTime(dur.start)} - {fmtTime(dur.end)}</span>
				{#if !dur.end}
					<span class="ml-2 text-yellow-600">(Active)</span>
				{/if}
			</li>
		{/each}
		{#if hasDurations}
			<li>
				<Button class="mt-2" variant="outline" size="sm" onclick={() => onEdit(-1)}>
					Edit durations
				</Button>
			</li>
		{/if}
		{#if lunchLabel}
			<li class="flex items-center gap-2">
				<span>Lunch: {lunchLabel}</span>
				<Button class="ml-2" variant="ghost" size="sm" onclick={() => onEdit('lunch')}>Edit</Button>
			</li>
		{/if}
		<li>Work Time: {workTime()}</li>
	</ul>
</div>
