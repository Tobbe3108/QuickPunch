<script lang="ts">
	import type { Keyed } from '../utils/KeyValueService';
	import type { TimeRecord } from '../models/TimeRecord';
	import { format, isValid, isSameDay } from 'date-fns';

	// Props
	let {
		record,
		onOpenEdit,
		onDelete
	}: {
		record: Keyed<TimeRecord>;
		onOpenEdit: (
			record: Keyed<TimeRecord>,
			mode: 'duration' | 'lunch' | 'internal',
			idx?: number | null
		) => void;
		onDelete: (record: Keyed<TimeRecord>) => void;
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
		{record.Durations ? record.Durations.length : 0}

		<button
			class="ml-2 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 focus:ring-2 focus:ring-blue-400 focus:outline-none"
			onclick={() => onOpenEdit(record, 'duration')}>Edit</button
		>
	</td>
	<td class="px-4 py-2 whitespace-nowrap">
		{#if record.lunchDuration}
			<span
				>{formatTime(record.lunchDuration?.start)} - {formatTime(record.lunchDuration?.end)}</span
			>
		{/if}
		<button
			class="ml-2 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 focus:ring-2 focus:ring-blue-400 focus:outline-none"
			aria-label="Edit lunch"
			onclick={() => onOpenEdit(record, 'lunch')}>Edit</button
		>
	</td>
	<td class="px-4 py-2 whitespace-nowrap">
		<span>
			{typeof record.internalCompanyTime === 'number'
				? `${Math.floor(record.internalCompanyTime / 3600000)
						.toString()
						.padStart(2, '0')}:${Math.floor((record.internalCompanyTime % 3600000) / 60000)
						.toString()
						.padStart(2, '0')}`
				: ''}
		</span>
		<button
			class="ml-2 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 focus:ring-2 focus:ring-blue-400 focus:outline-none"
			aria-label="Edit internal time"
			onclick={() => onOpenEdit(record, 'internal')}>Edit</button
		>
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
