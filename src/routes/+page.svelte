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

	// Modal state for editing (use new modals)
	let modalOpen = $state(false);
	let modalDurationsOpen = $state(false);
	let modalLunchOpen = $state(false);
	let modalIdx = $state<number | null>(null);

	// Confirmation dialog state
	let confirmOpen = $state(false);
	let confirmMessage = $state('');
	let confirmDeleteIndex = $state<number | 'lunch' | null>(null);

	function pad(num: number) {
		return num.toString().padStart(2, '0');
	}

	function toTimeStr(date: Date | null) {
		if (!date) return '';
		return pad(date.getHours()) + ':' + pad(date.getMinutes());
	}

	function handleEdit(index: number | 'lunch') {
		// Support -1 as the sentinel to open the shared durations editor for all durations
		if (index === -1) {
			modalOpen = true;
			modalDurationsOpen = true;
			modalLunchOpen = false;
			modalIdx = null;
			return;
		}
		if (index === 'lunch') {
			if (!record.lunchDuration) return;
			modalOpen = true;
			modalLunchOpen = true;
			modalDurationsOpen = false;
			modalIdx = null;
			return;
		}
		const dur = record.Durations?.[index];
		if (!dur) return;
		modalOpen = true;
		modalDurationsOpen = true;
		modalLunchOpen = false;
		modalIdx = index;
	}

	function handleDelete(index: number | 'lunch') {
		confirmDeleteIndex = index;
		confirmMessage =
			index === 'lunch'
				? 'Are you sure you want to delete the lunch record?'
				: 'Are you sure you want to delete this work segment?';
		confirmOpen = true;
	}

	function handleConfirmDelete() {
		if (confirmDeleteIndex === 'lunch') {
			if (!record.lunchDuration) return;
			record.lunchDuration = undefined;
			toast = 'Lunch deleted.';
		} else if (typeof confirmDeleteIndex === 'number' && record.Durations) {
			record.Durations.splice(confirmDeleteIndex, 1);
			toast = 'Segment deleted.';
		}
		confirmOpen = false;
		confirmDeleteIndex = null;
		confirmMessage = '';
	}

	function handleCancelDelete() {
		confirmOpen = false;
		confirmDeleteIndex = null;
		confirmMessage = '';
	}

	function handleModalSave(payload?: any) {
		if (!payload || !payload.record) return;
		const baseDate = record.date;
		if (payload.mode === 'lunch') {
			const [sh, sm] = (payload.startStr ?? '').split(':').map(Number);
			const [eh, em] = (payload.endStr ?? '').split(':').map(Number);
			if (!record.lunchDuration) record.lunchDuration = { start: new Date(baseDate) };
			record.lunchDuration.start = new Date(
				baseDate.getFullYear(),
				baseDate.getMonth(),
				baseDate.getDate(),
				sh,
				sm
			);
			if (!isNaN(eh) && !isNaN(em)) {
				record.lunchDuration.end = new Date(
					baseDate.getFullYear(),
					baseDate.getMonth(),
					baseDate.getDate(),
					eh,
					em
				);
			} else {
				record.lunchDuration.end = undefined;
			}
			toast = 'Lunch updated.';
		} else if (payload.mode === 'duration') {
			const idx = payload.durationIndex;
			if (typeof idx !== 'number' || !record.Durations) return;
			const [sh, sm] = (payload.startStr ?? '').split(':').map(Number);
			const [eh, em] = (payload.endStr ?? '').split(':').map(Number);
			record.Durations[idx].start = new Date(
				baseDate.getFullYear(),
				baseDate.getMonth(),
				baseDate.getDate(),
				sh,
				sm
			);
			if (!isNaN(eh) && !isNaN(em)) {
				record.Durations[idx].end = new Date(
					baseDate.getFullYear(),
					baseDate.getMonth(),
					baseDate.getDate(),
					eh,
					em
				);
			} else {
				record.Durations[idx].end = undefined;
			}
			toast = 'Segment updated.';
		} else if (payload.mode === 'durations' && Array.isArray(payload.durations)) {
			// replace all durations
			record.Durations = payload.durations.map((d: any) => {
				const [sh, sm] = (d.startStr ?? '').split(':').map(Number);
				const [eh, em] = (d.endStr ?? '').split(':').map(Number);
				let start: Date | undefined = undefined;
				let end: Date | undefined = undefined;
				if (!isNaN(sh) && !isNaN(sm))
					start = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), sh, sm);
				if (!isNaN(eh) && !isNaN(em))
					end = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), eh, em);
				return { start, end };
			});
			toast = 'Durations updated.';
		}
		// close modals
		modalOpen = false;
		modalDurationsOpen = false;
		modalLunchOpen = false;
		modalIdx = null;
	}

	function handleModalCancel() {
		modalOpen = false;
		modalDurationsOpen = false;
		modalLunchOpen = false;
		modalIdx = null;
	}

	function handleModalDelete(recordToDel?: any) {
		if (!recordToDel) return;
		// remove lunch
		record.lunchDuration = undefined;
		toast = 'Lunch deleted.';
		// close modal
		modalOpen = false;
		modalDurationsOpen = false;
		modalLunchOpen = false;
		modalIdx = null;
	}

	function fmtTime(val?: Date) {
		if (!val) return '';
		return format(val, 'HH:mm');
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
		open={confirmOpen}
		message={confirmMessage}
		onConfirm={handleConfirmDelete}
		onCancel={handleCancelDelete}
	/>

	{#if modalDurationsOpen}
		<EditDurationsModal
			open={modalOpen}
			{record}
			durationIndex={modalIdx}
			onSave={handleModalSave}
			onCancel={handleModalCancel}
		/>
	{/if}
	{#if modalLunchOpen}
		<EditLunchModal
			open={modalOpen}
			{record}
			onSave={handleModalSave}
			onCancel={handleModalCancel}
			onDelete={handleModalDelete}
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
