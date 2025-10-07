<script lang="ts">
	import type { TimeRecord } from '$lib/models/TimeRecord';
	import { idb } from '$lib/idbService';
	import { format, differenceInMilliseconds } from 'date-fns';
	import { onMount } from 'svelte';

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

	function handleEdit(field: keyof TimeRecord) {
		//TODO: Implement
	}

	function handleDelete(field: keyof TimeRecord) {
		if (field === 'Durations') record.Durations = [];
		else if (field === 'lunchDuration') record.lunchDuration = undefined;
		else if (field === 'internalCompanyTime') record.internalCompanyTime = undefined;
		toast = `${field} deleted.`;
	}

	function fmtTime(val?: Date) {
		if (!val) return '';
		return format(val, 'HH:mm');
	}

	function handleWipeDay() {
		record = {
			date: new Date(),
			Durations: [],
			lunchDuration: undefined,
			internalCompanyTime: undefined
		};
		toast = "Today's state wiped";
	}
</script>

<main class="mx-auto mt-8 max-w-md rounded bg-white p-4 shadow">
	<h1 class="mb-2 text-xl font-bold">QuickPunch</h1>
	<div class="mb-4 text-gray-600">{format(record.date, 'PPP')}</div>

	<div class="mb-4 flex flex-col gap-2">
		{#if availableActions()[0] === 'workStart'}
			<button class="btn-primary w-full" onclick={handleWorkStart}>Start Work</button>
		{:else}
			<button class="btn-warning w-full" onclick={handleWorkStop}>Stop Work</button>
		{/if}
		{#if availableActions().includes('lunchStart')}
			<button class="btn-primary w-full" onclick={handleLunchStart}>Start Lunch</button>
		{/if}
		{#if availableActions().includes('lunchEnd')}
			<button class="btn-primary w-full" onclick={handleLunchEnd}>End Lunch</button>
		{/if}
	</div>

	{#if toast}
		<div class="mt-2 text-green-600">{toast}</div>
	{/if}

	<div class="mt-6">
		<h2 class="mb-2 font-semibold">Today’s Times</h2>
		<ul class="space-y-1">
			{#each workDurations() as dur, i}
				<li>
					Work {i + 1}: {fmtTime(dur.start)} - {fmtTime(dur.end)}
					{#if !dur.end}
						<span class="ml-2 text-yellow-600">(Active)</span>
					{/if}
				</li>
			{/each}
			<li>
				Lunch: {fmtTime(record.lunchDuration?.start)} - {fmtTime(record.lunchDuration?.end)}
				<button class="ml-2 text-xs text-blue-600" onclick={() => handleEdit('lunchDuration')}
					>Edit</button
				>
				<button class="ml-1 text-xs text-red-600" onclick={() => handleDelete('lunchDuration')}
					>Delete</button
				>
			</li>
			<li>Work Time: {workTime()}</li>
		</ul>
		<button class="btn-danger mt-4 w-full" onclick={handleWipeDay}>Wipe Today’s State</button>
	</div>
</main>
