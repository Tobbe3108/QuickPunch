<script lang="ts">
	import type { Keyed } from '../utils/KeyValueService';
	import type { TimeRecord } from '../models/TimeRecord';
	import { format, isValid, isSameDay } from 'date-fns';

	// Props
	let {
		record,
		editingRecordId,
		editingType,
		editingIndex,
		editStartStr = $bindable(),
		editEndStr = $bindable(),
		editInternalStr = $bindable(),
		onEditDuration,
		onEditLunch,
		onEditInternal,
		onEditSave,
		onDelete,
		onEditCancel
	}: {
		record: Keyed<TimeRecord>;
		editingRecordId: string | null;
		editingType: 'duration' | 'lunch' | 'internal' | null;
		editingIndex: number | null;
		editStartStr: string;
		editEndStr: string;
		editInternalStr: string;
		onEditDuration: (record: Keyed<TimeRecord>, idx: number) => void;
		onEditLunch: (record: Keyed<TimeRecord>) => void;
		onEditInternal: (record: Keyed<TimeRecord>) => void;
		onEditSave: (record: Keyed<TimeRecord>) => void;
		onDelete: (record: Keyed<TimeRecord>) => void;
		onEditCancel: () => void;
	} = $props();

	function formatTime(date: Date | undefined): string {
		if (!date) return '';
		if (!isValid(date)) return '';
		return format(date, 'HH:mm');
	}
</script>

<tr class="border-t align-top">
	<td class="px-4 py-2 whitespace-nowrap capitalize">
		{record.date ? format(record.date, 'PPPP') : ''}
	</td>
	<td class="px-4 py-2 whitespace-nowrap">
		{#if record.Durations && record.Durations.length > 0}
			<ul class="space-y-1">
				{#each record.Durations as dur, idx}
					<li class="flex items-center gap-2">
						{#if editingRecordId === record.key && editingType === 'duration' && editingIndex === idx}
							<input
								type="text"
								class="w-14 rounded border px-1 text-xs"
								bind:value={editStartStr}
								placeholder="Start"
								aria-label="Edit start time"
								onkeydown={(e) => {
									if (e.key === 'Escape') onEditCancel();
								}}
							/>
							<span>-</span>
							<input
								type="text"
								class="w-14 rounded border px-1 text-xs"
								bind:value={editEndStr}
								placeholder="End"
								aria-label="Edit end time"
								onkeydown={(e) => {
									if (e.key === 'Escape') onEditCancel();
								}}
							/>
							<button
								class="ml-2 rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:outline-none"
								aria-label="Save duration"
								onclick={() => onEditSave(record)}>Save</button
							>
							<button
								class="ml-1 rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:outline-none"
								aria-label="Cancel edit"
								onclick={onEditCancel}>Cancel</button
							>
						{:else}
							<span>{formatTime(dur.start)} - {formatTime(dur.end)}</span>
							<button
								class="ml-2 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 focus:ring-2 focus:ring-blue-400 focus:outline-none"
								aria-label="Edit duration"
								onclick={() => onEditDuration(record, idx)}>Edit</button
							>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</td>
	<td class="px-4 py-2 whitespace-nowrap">
		{#if editingRecordId === record.key && editingType === 'lunch'}
			<input
				type="text"
				class="w-14 rounded border px-1 text-xs"
				bind:value={editStartStr}
				placeholder="Start"
				aria-label="Edit lunch start"
				onkeydown={(e) => {
					if (e.key === 'Escape') onEditCancel();
				}}
			/>
			<span>-</span>
			<input
				type="text"
				class="w-14 rounded border px-1 text-xs"
				bind:value={editEndStr}
				placeholder="End"
				aria-label="Edit lunch end"
				onkeydown={(e) => {
					if (e.key === 'Escape') onEditCancel();
				}}
			/>
			<button
				class="ml-2 rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:outline-none"
				aria-label="Save lunch"
				onclick={() => onEditSave(record)}>Save</button
			>
			<button
				class="ml-1 rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:outline-none"
				aria-label="Cancel edit"
				onclick={onEditCancel}>Cancel</button
			>
		{:else}
			<span
				>{formatTime(record.lunchDuration?.start)} - {formatTime(record.lunchDuration?.end)}</span
			>
			<button
				class="ml-2 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 focus:ring-2 focus:ring-blue-400 focus:outline-none"
				aria-label="Edit lunch"
				onclick={() => onEditLunch(record)}>Edit</button
			>
		{/if}
	</td>
	<td class="px-4 py-2 whitespace-nowrap">
		{#if editingRecordId === record.key && editingType === 'internal'}
			<input
				type="text"
				class="w-14 rounded border px-1 text-xs"
				bind:value={editInternalStr}
				placeholder="HH:mm"
				aria-label="Edit internal time"
				onkeydown={(e) => {
					if (e.key === 'Escape') onEditCancel();
				}}
			/>
			<button
				class="ml-2 rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:outline-none"
				aria-label="Save internal time"
				onclick={() => onEditSave(record)}>Save</button
			>
			<button
				class="ml-1 rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:outline-none"
				aria-label="Cancel edit"
				onclick={onEditCancel}>Cancel</button
			>
		{:else}
			<span
				>{typeof record.internalCompanyTime === 'number'
					? `${Math.floor(record.internalCompanyTime / 3600000)
							.toString()
							.padStart(2, '0')}:${Math.floor((record.internalCompanyTime % 3600000) / 60000)
							.toString()
							.padStart(2, '0')}`
					: ''}</span
			>
			<button
				class="ml-2 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 focus:ring-2 focus:ring-blue-400 focus:outline-none"
				aria-label="Edit internal time"
				onclick={() => onEditInternal(record)}>Edit</button
			>
		{/if}
	</td>
	<td class="px-4 py-2 whitespace-nowrap">
		{record.Durations ? record.Durations.length : 0}
	</td>
	<td class="flex flex-col gap-2 px-4 py-2 whitespace-nowrap">
		<button
			class="inline-flex items-center rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 focus:ring-2 focus:ring-red-400 focus:outline-none"
			aria-label="Delete record"
			onclick={() => onDelete(record)}
		>
			Delete
		</button>
	</td>
</tr>
