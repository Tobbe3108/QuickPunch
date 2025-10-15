<script lang="ts">
	import type { Keyed } from '../utils/KeyValueService';
	import type { TimeRecord } from '../models/TimeRecord';
	import { format, isValid } from 'date-fns';

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

	const formattedDate = $derived(() => (record.date ? format(record.date, 'PPPP') : ''));
	const durationCount = $derived(() => record.Durations?.length ?? 0);
	const lunchLabel = $derived(() =>
		formatRange(record.lunchDuration?.start, record.lunchDuration?.end)
	);
	const internalLabel = $derived(() => formatInternal(record.internalCompanyTime));

	function formatRange(start?: Date, end?: Date) {
		const startTime = formatTime(start);
		const endTime = formatTime(end);
		if (!startTime && !endTime) return '';
		return `${startTime}${endTime ? ` - ${endTime}` : ''}`;
	}

	function formatInternal(milliseconds?: number) {
		if (typeof milliseconds !== 'number' || Number.isNaN(milliseconds)) return '';
		const totalMinutes = Math.max(0, Math.floor(milliseconds / 60000));
		const hours = Math.floor(totalMinutes / 60)
			.toString()
			.padStart(2, '0');
		const minutes = (totalMinutes % 60).toString().padStart(2, '0');
		return `${hours}:${minutes}`;
	}

	function formatTime(date?: Date) {
		if (!date || !isValid(date)) return '';
		return format(date, 'HH:mm');
	}
</script>

<tr class="border-t align-top">
	<td class="px-4 py-2 whitespace-nowrap capitalize">
		{formattedDate()}
	</td>
	<td class="px-4 py-2 whitespace-nowrap">
		{durationCount()}

		<button
			class="ml-2 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 focus:ring-2 focus:ring-blue-400 focus:outline-none"
			onclick={() => onOpenEdit(record, 'duration')}>Edit</button
		>
	</td>
	<td class="px-4 py-2 whitespace-nowrap">
		{#if lunchLabel}
			<span>{lunchLabel()}</span>
		{/if}
		<button
			class="ml-2 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 focus:ring-2 focus:ring-blue-400 focus:outline-none"
			aria-label="Edit lunch"
			onclick={() => onOpenEdit(record, 'lunch')}>Edit</button
		>
	</td>
	<td class="px-4 py-2 whitespace-nowrap">
		<span>{internalLabel()}</span>
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
