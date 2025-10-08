<script lang="ts">
	let { record, workDurations, workTime, onWipeDay, fmtTime, onEdit, onDelete } = $props();
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
				<button class="btn-xs btn-outline ml-2" onclick={() => onEdit(i)}>Edit</button>
				<button class="btn-xs btn-danger ml-1" onclick={() => onDelete(i)}>Delete</button>
			</li>
		{/each}
		{#if record.lunchDuration}
			<li class="flex items-center gap-2">
				<span
					>Lunch: {fmtTime(record.lunchDuration?.start)} - {fmtTime(
						record.lunchDuration?.end
					)}</span
				>
				<button class="btn-xs btn-outline ml-2" onclick={() => onEdit('lunch')}>Edit</button>
				<button class="btn-xs btn-danger ml-1" onclick={() => onDelete('lunch')}>Delete</button>
			</li>
		{/if}
		<li>Work Time: {workTime()}</li>
	</ul>
	<button class="btn-danger mt-4 w-full" onclick={onWipeDay}>Wipe Todays State</button>
</div>
