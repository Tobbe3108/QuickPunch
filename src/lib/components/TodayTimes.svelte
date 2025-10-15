<script lang="ts">
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
				<button
					class="mt-2 rounded border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-600 hover:bg-blue-100 focus:ring-2 focus:ring-blue-400 focus:outline-none"
					onclick={() => onEdit(-1)}
				>
					Edit durations
				</button>
			</li>
		{/if}
		{#if lunchLabel}
			<li class="flex items-center gap-2">
				<span>Lunch: {lunchLabel}</span>
				<button
					class="ml-2 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 focus:ring-2 focus:ring-blue-400 focus:outline-none"
					onclick={() => onEdit('lunch')}>Edit</button
				>
			</li>
		{/if}
		<li>Work Time: {workTime()}</li>
	</ul>
</div>
