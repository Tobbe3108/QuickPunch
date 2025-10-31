<script lang="ts">
	import type { Keyed } from '../utils/KeyValueService';
	import type { TimeRecord } from '../models/TimeRecord';
	import { format, isValid } from 'date-fns';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';

	let {
		record,
		onOpenEdit,
		onDelete,
		onNavigate
	}: {
		record: Keyed<TimeRecord>;
		onOpenEdit: (
			record: Keyed<TimeRecord>,
			mode: 'duration' | 'lunch' | 'internal',
			idx?: number | null
		) => void;
		onDelete: (record: Keyed<TimeRecord>) => void;
		onNavigate?: (dateStr: string) => void;
	} = $props();

	import { goto } from '$app/navigation';

	function keyForDate(d: Date) {
		const yyyy = d.getFullYear();
		const mm = String(d.getMonth() + 1).padStart(2, '0');
		const dd = String(d.getDate()).padStart(2, '0');
		return `${yyyy}-${mm}-${dd}`;
	}

	function navigate(e?: MouseEvent) {
		// don't navigate when clicking interactive elements inside the row
		if (e) {
			const target = e.target as HTMLElement | null;
			if (target && target.closest('button')) return;
		}
		const key = keyForDate(record.date);
		if (onNavigate) {
			onNavigate(key);
		} else {
			goto(`/reporting?date=${key}`);
		}
	}

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

<Table.Row class="cursor-pointer align-top" onclick={navigate}>
	<Table.Cell class="whitespace-nowrap capitalize">
		{formattedDate()}
	</Table.Cell>
	<Table.Cell class="whitespace-nowrap">
		{durationCount()}

		<Button class="ml-2" variant="ghost" size="sm" onclick={() => onOpenEdit(record, 'duration')}>
			Edit
		</Button>
	</Table.Cell>
	<Table.Cell class="whitespace-nowrap">
		{#if lunchLabel}
			<span>{lunchLabel()}</span>
		{/if}
		<Button
			class="ml-2"
			variant="ghost"
			size="sm"
			aria-label="Edit lunch"
			onclick={() => onOpenEdit(record, 'lunch')}
		>
			Edit
		</Button>
	</Table.Cell>
	<Table.Cell class="whitespace-nowrap">
		<span>{internalLabel()}</span>
		<Button
			class="ml-2"
			variant="ghost"
			size="sm"
			aria-label="Edit internal time"
			onclick={() => onOpenEdit(record, 'internal')}
		>
			Edit
		</Button>
	</Table.Cell>
	<Table.Cell class="flex flex-col gap-2 whitespace-nowrap">
		<Button
			variant="destructive"
			size="sm"
			aria-label="Delete record"
			onclick={() => onDelete(record)}
		>
			Delete
		</Button>
	</Table.Cell>
</Table.Row>
