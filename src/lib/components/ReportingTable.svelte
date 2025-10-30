<script lang="ts">
	import type { Keyed } from '$lib/utils/KeyValueService';
	import type { TimeRecord } from '$lib/models/TimeRecord';
	import { formatTimeHHMM, formatDecimalHours } from '$lib/utils/timeCalc';

	export let record: Keyed<TimeRecord> | null = null;
	export let index = -1;
	export let total = 0;
	export let workMs: number | null = null;
	export let onPrev: () => void;
	export let onNext: () => void;
	export let onBack: () => void;
	export let onPersistInternal: (value: string) => Promise<void>;
	export let onCopy: (label: string, value: string) => Promise<void>;

	let internalStr = '';

	// separate the displayed internal value (formatted from record) from the editable input
	let internalInputStr = '';

	$: displayInternal = record ? formatDecimalHours(record.internalCompanyTime ?? 0) : '';

	$: if (record && !internalInputStr)
		internalInputStr = formatDecimalHours(record.internalCompanyTime ?? 0);

	function fmtTime(d?: Date | null) {
		return formatTimeHHMM(d ?? null);
	}

	async function handlePersist() {
		await onPersistInternal?.(internalStr);
	}
</script>

{#if !record}
	<div class="text-gray-600">No record for selected date</div>
{:else}
	<div class="flex flex-col gap-4">
		<div class="flex items-center justify-between">
			<div class="flex gap-2">
				<button class="rounded border px-3 py-1" onclick={onPrev} disabled={index <= 0}>Prev</button
				>
				<button class="rounded border px-3 py-1" onclick={onNext} disabled={index >= total - 1}
					>Next</button
				>
			</div>

			<div class="text-sm text-gray-600">
				{record
					? `${record.date.getFullYear()}-${String(record.date.getMonth() + 1).padStart(2, '0')}-${String(record.date.getDate()).padStart(2, '0')}`
					: ''}
			</div>
		</div>

		<!-- Row layout: label | value/input | copy -->
		<div class="grid grid-cols-12 items-center gap-3">
			<div class="col-span-4 text-xs text-gray-500">Date</div>
			<div class="col-span-7">{record ? `${record.date.toISOString().slice(0, 10)}` : ''}</div>

			<div class="col-span-4 text-xs text-gray-500">Meet</div>
			<div class="col-span-7">{fmtTime(record?.Durations?.[0]?.start)}</div>

			<div class="col-span-4 text-xs text-gray-500">Leave</div>
			<div class="col-span-7">
				{fmtTime(record?.Durations?.[record?.Durations?.length - 1]?.end)}
			</div>

			<div class="col-span-4 text-xs text-gray-500">Lunch</div>
			<div class="col-span-7">
				{record?.lunchDuration
					? `${fmtTime(record.lunchDuration.start)} - ${fmtTime(record.lunchDuration.end)}`
					: ''}
			</div>

			<!-- Editable input for internal time is separated from the display/copy action -->
			<div class="col-span-4 text-xs text-gray-500">Edit internal</div>
			<div class="col-span-7">
				<input
					class="w-full rounded border px-2 py-1 text-sm"
					aria-label="Edit internal company time"
					bind:value={internalInputStr}
					onblur={() => onPersistInternal?.(internalInputStr)}
					onkeydown={(e) => e.key === 'Enter' && onPersistInternal?.(internalInputStr)}
				/>
			</div>

			<div class="col-span-4 text-xs text-gray-500">Internal</div>
			<div class="col-span-7">{displayInternal}</div>
			<div class="col-span-1 text-right">
				<button
					class="text-blue-600"
					onclick={() => onCopy('Internal', displayInternal)}
					aria-label="Copy internal time">Copy</button
				>
			</div>

			<div class="col-span-4 text-xs text-gray-500">Work</div>
			<div class="col-span-7">{workMs === null ? '' : formatDecimalHours(workMs)}</div>
			<div class="col-span-1 text-right">
				<button
					class="text-blue-600"
					onclick={() => onCopy('Work', workMs === null ? '' : formatDecimalHours(workMs))}
					aria-label="Copy work time">Copy</button
				>
			</div>
		</div>

		<div class="flex justify-end">
			<button class="rounded border px-3 py-1" onclick={onBack}>Back to history</button>
		</div>
	</div>
{/if}
