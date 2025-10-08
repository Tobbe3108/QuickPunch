<script lang="ts">
	import type { TimeRecord } from '$lib/models/TimeRecord';
	import { idb } from '$lib/utils/idbService';
	import { format, differenceInMilliseconds } from 'date-fns';
	import { onMount } from 'svelte';
	import ActionButtons from '$lib/components/ActionButtons.svelte';
	import TodayTimes from '$lib/components/TodayTimes.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import EditSegmentModal from '$lib/components/EditSegmentModal.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';

	const todayKey = 'record-' + format(new Date(), 'yyyy-MM-dd');

	let record = $state<TimeRecord>({
		date: new Date(),
		Durations: []
	});
	let toast = $state('');

	onMount(() => {
		idb.get<TimeRecord>(todayKey).then((value) => {
			if (value) record = value;
		});
	});

	$effect(() => {
		idb.set<TimeRecord>(todayKey, $state.snapshot(record));
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

		let internalMilliseconds = 0;
		if (record.internalCompanyTime) {
			internalMilliseconds = record.internalCompanyTime.getTime();
		}

		let workTimeMilliseconds = totalMilliseconds - lunchMilliseconds + internalMilliseconds;
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

	// Modal state for editing
	let editModalOpen = $state(false);
	let editIndex = $state<number | null>(null);
	let editStart = $state<Date | null>(null);
	let editEnd = $state<Date | null>(null);
	let editStartStr = $state('');
	let editEndStr = $state('');

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
		if (index === 'lunch') {
			if (!record.lunchDuration) return;
			editIndex = 'lunch';
			editStart = record.lunchDuration.start;
			editEnd = record.lunchDuration.end ?? null;
			editStartStr = toTimeStr(editStart);
			editEndStr = toTimeStr(editEnd);
			editModalOpen = true;
			return;
		}
		const dur = record.Durations?.[index];
		if (!dur) return;
		editIndex = index;
		editStart = dur.start;
		editEnd = dur.end ?? null;
		editStartStr = toTimeStr(editStart);
		editEndStr = toTimeStr(editEnd);
		editModalOpen = true;
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

	function handleModalSave() {
		const baseDate = record.date;
		const [sh, sm] = editStartStr.split(':').map(Number);
		const [eh, em] = editEndStr.split(':').map(Number);
		if (editIndex === 'lunch') {
			if (!record.lunchDuration) return;
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
		} else {
			if (editIndex === null || !record.Durations) return;
			record.Durations[editIndex].start = new Date(
				baseDate.getFullYear(),
				baseDate.getMonth(),
				baseDate.getDate(),
				sh,
				sm
			);
			if (!isNaN(eh) && !isNaN(em)) {
				record.Durations[editIndex].end = new Date(
					baseDate.getFullYear(),
					baseDate.getMonth(),
					baseDate.getDate(),
					eh,
					em
				);
			} else {
				record.Durations[editIndex].end = undefined;
			}
			toast = 'Segment updated.';
		}
		editModalOpen = false;
		editIndex = null;
		editStart = null;
		editEnd = null;
		editStartStr = '';
		editEndStr = '';
	}

	function handleModalCancel() {
		editModalOpen = false;
		editIndex = null;
		editStart = null;
		editEnd = null;
		editStartStr = '';
		editEndStr = '';
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

	<EditSegmentModal
		open={editModalOpen}
		startStr={editStartStr}
		endStr={editEndStr}
		setStartStr={(val: string) => (editStartStr = val)}
		setEndStr={(val: string) => (editEndStr = val)}
		onSave={handleModalSave}
		onCancel={handleModalCancel}
	/>

	<TodayTimes
		{record}
		{workDurations}
		{workTime}
		onEdit={handleEdit}
		onDelete={handleDelete}
		{fmtTime}
	/>
</main>
