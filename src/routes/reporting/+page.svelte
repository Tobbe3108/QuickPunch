<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { idb } from '$lib/utils/KeyValueService';
	import type { Keyed } from '$lib/utils/KeyValueService';
	import type { TimeRecord } from '$lib/models/TimeRecord';
	import { computeWorkTime, formatDecimalHours, parseDecimalHoursToMs } from '$lib/utils/timeCalc';
	import { copyText } from '$lib/utils/copy';
	import Toast from '$lib/components/Toast.svelte';
	import { updateRecord } from '$lib/utils/recordMutations';
	import { goto } from '$app/navigation';
	import ReportingTable from '$lib/components/ReportingTable.svelte';
	import { toasts } from '$lib/stores/toastStore';

	let records = [] as Array<Keyed<TimeRecord>>;
	let currentIndex = -1;
	let loading = true;
	let error: string | null = null;

	// editable internal time string (decimal hours)
	let internalStr = '';

	async function loadAll() {
		loading = true;
		try {
			const keys = await idb.keys();
			const fetched = await Promise.all(keys.map((k) => idb.get<TimeRecord>(String(k))));
			records = fetched.filter(Boolean) as Array<Keyed<TimeRecord>>;
			// sort ascending by date for prev/next convenience
			records.sort((a, b) => a.date.getTime() - b.date.getTime());
			error = null;
		} catch (e) {
			console.error(e);
			error = 'Failed to load records';
		} finally {
			loading = false;
		}
	}

	function keyForDate(d: Date) {
		const yyyy = d.getFullYear();
		const mm = String(d.getMonth() + 1).padStart(2, '0');
		const dd = String(d.getDate()).padStart(2, '0');
		return `${yyyy}-${mm}-${dd}`;
	}

	function findIndexForDate(theDate: Date) {
		return records.findIndex((r) => keyForDate(r.date) === keyForDate(theDate));
	}

	function findNearestIndex(targetDate: Date) {
		if (!records || records.length === 0) return -1;
		// exact match
		const exact = findIndexForDate(targetDate);
		if (exact !== -1) return exact;
		// find nearest by absolute time difference
		let bestIdx = 0;
		let bestDiff = Math.abs(records[0].date.getTime() - targetDate.getTime());
		for (let i = 1; i < records.length; i++) {
			const diff = Math.abs(records[i].date.getTime() - targetDate.getTime());
			if (diff < bestDiff) {
				bestDiff = diff;
				bestIdx = i;
			}
		}
		return bestIdx;
	}

	$: queryDate = (() => {
		const q = $page.url.searchParams.get('date');
		if (!q) return undefined;
		const d = new Date(q);
		return Number.isNaN(d.getTime()) ? undefined : d;
	})();

	$: currentRecord = currentIndex >= 0 && records[currentIndex] ? records[currentIndex] : null;

	$: workMs = currentRecord ? computeWorkTime(currentRecord) : null;

	onMount(() => {
		// run async initialization without making the onMount callback itself async
		(async () => {
			await loadAll();
			let targetDate = queryDate ?? new Date();
			currentIndex = findIndexForDate(targetDate);
			if (currentIndex === -1 && records.length > 0) {
				// fallback: pick nearest record to the supplied date
				currentIndex = findNearestIndex(targetDate);
			}
			if (currentRecord) {
				internalStr = String(formatDecimalHours(currentRecord.internalCompanyTime ?? 0));
			}
		})();

		// add keyboard navigation
		const onKey = (e: KeyboardEvent) => {
			if (!currentRecord) return;
			if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
				e.preventDefault();
				goTo(currentIndex - 1);
			}
			if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
				e.preventDefault();
				goTo(currentIndex + 1);
			}
			if (e.key === 'Home') {
				e.preventDefault();
				goTo(0);
			}
			if (e.key === 'End') {
				e.preventDefault();
				goTo(records.length - 1);
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	$: if (currentRecord && !internalStr) {
		internalStr = String(formatDecimalHours(currentRecord.internalCompanyTime ?? 0));
	}

	function goTo(idx: number) {
		if (idx < 0 || idx >= records.length) return;
		currentIndex = idx;
		const r = records[currentIndex];
		// update URL param without navigation
		const url = new URL(window.location.href);
		url.searchParams.set('date', keyForDate(r.date));
		window.history.replaceState({}, '', url.toString());
		internalStr = String(formatDecimalHours(r.internalCompanyTime ?? 0));
	}

	// debounce helper for scheduled internal persistence
	let _persistTimer: ReturnType<typeof setTimeout> | null = null;
	function schedulePersistInternal(ms = 350) {
		if (_persistTimer) clearTimeout(_persistTimer as any);
		_persistTimer = setTimeout(() => {
			persistInternal();
			_persistTimer = null;
		}, ms);
	}

	async function persistInternal() {
		if (!currentRecord) return;
		const key = currentRecord.key;
		const ms = parseDecimalHoursToMs(internalStr);
		try {
			const updated = await updateRecord(key, (r) => {
				(r as any).internalCompanyTime = ms;
				return true;
			});
			if (updated) {
				// keep in-memory list in sync
				records[currentIndex] = updated;
				toasts.push('Saved internal time');
			}
		} catch (e) {
			console.error(e);
			toasts.push('Failed to save');
		}
	}

	async function handleCopy(label: string, val: string) {
		try {
			const ok = await copyText(val);
			if (ok) {
				toasts.push(`${label} copied`);
			} else {
				toasts.push(`Unable to copy ${label}`);
			}
		} catch (e) {
			console.error(e);
			toasts.push('Copy failed');
		}
	}
</script>

<div class="mx-auto mt-6 max-w-3xl p-4">
	<h1 class="mb-4 text-lg font-semibold">Reporting</h1>

	{#if loading}
		<div class="text-gray-500">Loading...</div>
	{:else if error}
		<div class="text-red-500">{error}</div>
	{:else}
		<ReportingTable
			record={currentRecord}
			index={currentIndex}
			total={records.length}
			{workMs}
			onPrev={() => goTo(currentIndex - 1)}
			onNext={() => goTo(currentIndex + 1)}
			onBack={() => goto('/history')}
			onPersistInternal={async (val: string) => {
				internalStr = val;
				await persistInternal();
			}}
			onCopy={async (label: string, val: string) => await handleCopy(label, val)}
		/>
	{/if}

	<div class="fixed right-4 bottom-4 space-y-2">
		{#each $toasts as t (t.id)}
			<Toast toast={t.text} onClose={() => toasts.remove(t.id)} />
		{/each}
	</div>
</div>
