<script lang="ts">
	import type { TimeRecord } from '$lib/models/TimeRecord';
	import { idb, type Keyed } from '$lib/utils/KeyValueService';
	import { format, differenceInMilliseconds } from 'date-fns';
	import { onMount } from 'svelte';
	import ActionButtons from '$lib/components/ActionButtons.svelte';
	import TodayTimes from '$lib/components/TodayTimes.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import EditDurationsModal from '$lib/components/EditDurationsModal.svelte';
	import EditLunchModal from '$lib/components/EditLunchModal.svelte';

	type ModalState =
		| { kind: 'none' }
		| { kind: 'durations'; index: number | null }
		| { kind: 'lunch' };

	type ConfirmState = { open: false } | { open: true; target: number | 'lunch'; message: string };

	let record = $state<Keyed<TimeRecord>>({
		key: format(new Date(), 'yyyy-MM-dd'),
		date: new Date(),
		Durations: []
	});
	let toast = $state('');

	onMount(() => {
		idb.get<TimeRecord>(record.key).then((value) => {
			if (value) record = value;
		});
	});

	$effect(() => {
		idb.set<TimeRecord>($state.snapshot(record));
	});

	const workDurations = $derived(() => record.Durations ?? []);

	const activeDuration = $derived(() => {
		const ds = workDurations();
		return ds.length && !ds[ds.length - 1].end ? ds[ds.length - 1] : null;
	});

	const workTime = $derived(() => {
		const ds = workDurations();
		let totalMilliseconds = 0;
		for (const dur of ds) {
			if (!dur.end) continue;
			totalMilliseconds += differenceInMilliseconds(dur.end, dur.start);
		}

		let lunchMilliseconds = 0;
		if (record.lunchDuration?.start && record.lunchDuration?.end) {
			lunchMilliseconds = differenceInMilliseconds(
				record.lunchDuration.end,
				record.lunchDuration.start
			);
		}

		let workTimeMilliseconds = totalMilliseconds - lunchMilliseconds;
		if (workTimeMilliseconds <= 0) {
			return '00:00';
		}
		const resultDate = new Date(new Date(0, 0, 0, 0, 0, 0, 0).getTime() + workTimeMilliseconds);
		return format(resultDate, 'HH:mm');
	});

	const availableActions = $derived(() => {
		return [
			!activeDuration() ? 'workStart' : 'workStop',
			!record.lunchDuration?.start ? 'lunchStart' : !record.lunchDuration?.end ? 'lunchEnd' : null
		].filter(Boolean);
	});

	function handleWorkStart() {
		const now = new Date();
		if (record.lunchDuration?.start && !record.lunchDuration?.end) {
			record.lunchDuration.end = now;
		}

		record.Durations?.push({ start: now });

		toast = 'Work started.';
	}

	function handleWorkStop() {
		const active = activeDuration();
		active!.end = new Date();
		toast = 'Work stopped.';
	}

	function handleLunchStart() {
		const now = new Date();
		const active = activeDuration();
		if (active && !active.end) active.end = now;
		record.lunchDuration = { start: now };
		toast = 'Lunch started.';
	}

	function handleLunchEnd() {
		record.lunchDuration!.end = new Date();
		toast = 'Lunch ended';
	}

	// Modal state: each modal manages its own open/close state independently
	let durationsModal = $state<{ open: boolean; index: number | null }>({
		open: false,
		index: null
	});
	const isDurationsModal = $derived(() => durationsModal.open);
	const durationsModalIndex = $derived(() => durationsModal.index);

	let lunchModalOpen = $state(false);
	const isLunchModal = $derived(() => lunchModalOpen);

	// Confirmation dialog state - per-modal
	let durationsConfirm = $state<{ open: boolean; target: number | null; message: string }>({
		open: false,
		target: null,
		message: ''
	});
	const durationsConfirmOpen = $derived(() => durationsConfirm.open);
	const durationsConfirmMessage = $derived(() =>
		durationsConfirm.open ? durationsConfirm.message : ''
	);

	let lunchConfirm = $state<{ open: boolean; message: string }>({ open: false, message: '' });
	const lunchConfirmOpen = $derived(() => lunchConfirm.open);
	const lunchConfirmMessage = $derived(() => (lunchConfirm.open ? lunchConfirm.message : ''));

	function handleEdit(index: number | 'lunch') {
		// Support -1 as the sentinel to open the shared durations editor for all durations
		if (index === -1) {
			durationsModal = { open: true, index: null };
			return;
		}
		if (index === 'lunch') {
			if (!record.lunchDuration) return;
			lunchModalOpen = true;
			return;
		}
		const dur = record.Durations?.[index];
		if (!dur) return;
		durationsModal = { open: true, index };
	}

	function handleDelete(index: number | 'lunch') {
		if (index === 'lunch') {
			lunchConfirm = { open: true, message: 'Are you sure you want to delete the lunch record?' };
			return;
		}
		// durations deletion
		durationsConfirm = {
			open: true,
			target: index,
			message: 'Are you sure you want to delete this work segment?'
		};
	}

	function handleConfirmDurationsDelete() {
		if (!durationsConfirm.open) return;
		const target = durationsConfirm.target;
		if (typeof target === 'number' && record.Durations) {
			record.Durations.splice(target, 1);
			toast = 'Segment deleted.';
		}
		durationsConfirm = { open: false, target: null, message: '' };
	}

	function handleCancelDurationsDelete() {
		durationsConfirm = { open: false, target: null, message: '' };
	}

	function handleConfirmLunchDelete() {
		if (!lunchConfirm.open) return;
		if (record.lunchDuration) {
			record.lunchDuration = undefined;
			toast = 'Lunch deleted.';
		}
		lunchConfirm = { open: false, message: '' };
	}

	function handleCancelLunchDelete() {
		lunchConfirm = { open: false, message: '' };
	}

	function handleDurationsSave(payload?: any) {
		if (!payload || !payload.record) return;
		const baseDate = record.date;
		if (payload.mode === 'duration') {
			const idx = payload.durationIndex;
			if (typeof idx !== 'number' || !record.Durations) return;
			const start = toDateForDay(baseDate, payload.startStr);
			const end = toDateForDay(baseDate, payload.endStr);
			if (start) {
				record.Durations[idx].start = start;
			}
			record.Durations[idx].end = end;
			toast = 'Segment updated.';
		} else if (payload.mode === 'durations' && Array.isArray(payload.durations)) {
			// replace all durations
			const existing = record.Durations ?? [];
			record.Durations = payload.durations.map((d: any, idx: number) => {
				const start =
					toDateForDay(baseDate, d.startStr) ?? existing[idx]?.start ?? new Date(baseDate);
				const end = toDateForDay(baseDate, d.endStr);
				return { start, end };
			});
			toast = 'Durations updated.';
		}
		// close durations modal only
		closeDurationsModal();
	}

	function handleLunchSave(payload?: any) {
		if (!payload || !payload.record) return;
		const baseDate = record.date;
		const start =
			toDateForDay(baseDate, payload.startStr) ?? record.lunchDuration?.start ?? new Date(baseDate);
		const end = toDateForDay(baseDate, payload.endStr);
		record.lunchDuration = { start, end };
		toast = 'Lunch updated.';
		// close lunch modal only
		closeLunchModal();
	}

	function handleDurationsCancel() {
		closeDurationsModal();
	}

	function handleLunchCancel() {
		closeLunchModal();
	}

	function handleLunchDelete(recordToDel?: any) {
		if (!recordToDel) return;
		// remove lunch
		record.lunchDuration = undefined;
		toast = 'Lunch deleted.';
		// close lunch modal
		closeLunchModal();
	}

	function fmtTime(val?: Date) {
		if (!val) return '';
		return format(val, 'HH:mm');
	}

	function toDateForDay(day: Date, timeStr?: string) {
		if (!timeStr) return undefined;
		const [hours, minutes] = timeStr.split(':').map(Number);
		if (Number.isNaN(hours) || Number.isNaN(minutes)) return undefined;
		return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes);
	}

	function closeDurationsModal() {
		durationsModal = { open: false, index: null };
	}

	function closeLunchModal() {
		lunchModalOpen = false;
	}
</script>

<main class="mx-auto mt-8 max-w-md rounded bg-white p-4 shadow">
	<h1 class="mb-2 text-xl font-bold">QuickPunch</h1>
	<div class="mb-4 text-gray-600">{format(record.date, 'PPP')}</div>

	<ActionButtons
		{availableActions}
		onWorkStart={handleWorkStart}
		onWorkStop={handleWorkStop}
		onLunchStart={handleLunchStart}
		onLunchEnd={handleLunchEnd}
	/>

	<Toast {toast} />

	<ConfirmDialog
		open={durationsConfirmOpen()}
		message={durationsConfirmMessage()}
		onConfirm={handleConfirmDurationsDelete}
		onCancel={handleCancelDurationsDelete}
	/>
	<ConfirmDialog
		open={lunchConfirmOpen()}
		message={lunchConfirmMessage()}
		onConfirm={handleConfirmLunchDelete}
		onCancel={handleCancelLunchDelete}
	/>

	{#if isDurationsModal()}
		<EditDurationsModal
			open={isDurationsModal()}
			{record}
			durationIndex={durationsModalIndex()}
			onSave={handleDurationsSave}
			onCancel={handleDurationsCancel}
		/>
	{/if}
	{#if isLunchModal()}
		<EditLunchModal
			open={isLunchModal()}
			{record}
			onSave={handleLunchSave}
			onCancel={handleLunchCancel}
			onDelete={() =>
				(lunchConfirm = {
					open: true,
					message: 'Are you sure you want to delete the lunch record?'
				})}
		/>
	{/if}

	<a
		href="/history"
		class="mt-6 block w-full rounded bg-blue-600 py-2 text-center font-semibold text-white shadow transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:outline-none"
		>View History</a
	>

	<TodayTimes
		{record}
		{workDurations}
		{workTime}
		onEdit={handleEdit}
		onDelete={handleDelete}
		{fmtTime}
	/>
</main>
