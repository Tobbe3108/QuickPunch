<script lang="ts">
	import type { Keyed } from './../utils/KeyValueService.ts';
	import { onMount } from 'svelte';
	import { idb } from '../utils/KeyValueService';
	import type { TimeRecord } from '../models/TimeRecord';
	import { format, isValid, compareDesc, isSameDay } from 'date-fns';
	import ConfirmDialog from './ConfirmDialog.svelte';
	import HistoryRow from './HistoryRow.svelte';

	let confirmDialogOpen = false;
	let deleteRecord: Keyed<TimeRecord> | null = null;

	let records: Keyed<TimeRecord>[] = [];
	let loading = true;
	let error: string | null = null;

	// Inline editing state
	let editingRecordId: string | null = null;
	let editingType: 'duration' | 'lunch' | 'internal' | null = null;
	let editingIndex: number | null = null; // For duration index
	let editStartStr = '';
	let editEndStr = '';
	let editInternalStr = '';
	function handleEditInternal(record: Keyed<TimeRecord>) {
		editingRecordId = record.key;
		editingType = 'internal';
		editingIndex = null;
		// Format internalCompanyTime as HH:mm (milliseconds)
		if (typeof record.internalCompanyTime === 'number') {
			const totalMinutes = Math.floor(record.internalCompanyTime / 60000);
			const h = Math.floor(totalMinutes / 60);
			const m = totalMinutes % 60;
			editInternalStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
		} else {
			editInternalStr = '';
		}
	}

	onMount(async () => {
		loading = true;
		try {
			// Fetch all keys and get records
			const keys = await idb.keys();
			const fetchedRecords: Keyed<TimeRecord>[] = [];
			for (const key of keys) {
				const rec = await idb.get<TimeRecord>(key as string);
				if (rec) fetchedRecords.push(rec);
			}
			records = fetchedRecords.sort((a, b) => compareDesc(a.date, b.date));
			error = null;
		} catch (e) {
			error = 'Failed to load history.';
		} finally {
			loading = false;
		}
	});

	function formatTime(date: Date | undefined): string {
		if (!date) return '';
		if (!isValid(date)) return '';
		return format(date, 'HH:mm');
	}

	function handleEditDuration(record: Keyed<TimeRecord>, idx: number) {
		editingRecordId = record.key;
		editingType = 'duration';
		editingIndex = idx;
		editStartStr = formatTime(record.Durations?.[idx]?.start);
		editEndStr = formatTime(record.Durations?.[idx]?.end);
	}

	function handleEditLunch(record: Keyed<TimeRecord>) {
		editingRecordId = record.key;
		editingType = 'lunch';
		editingIndex = null;
		editStartStr = formatTime(record.lunchDuration?.start);
		editEndStr = formatTime(record.lunchDuration?.end);
	}

	async function handleEditSave(record: Keyed<TimeRecord>) {
		if (!editingType) return;
		try {
			if (
				editingType === 'duration' &&
				editingIndex !== null &&
				record.Durations &&
				record.Durations[editingIndex]
			) {
				const [sh, sm] = editStartStr.split(':').map(Number);
				const [eh, em] = editEndStr.split(':').map(Number);
				if (!isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em)) {
					const start = new Date(record.date);
					start.setHours(sh, sm, 0, 0);
					const end = new Date(record.date);
					end.setHours(eh, em, 0, 0);
					// Defensive: clone durations array to trigger reactivity
					const newDurations = record.Durations.map((d, i) =>
						i === editingIndex ? { ...d, start, end } : d
					);
					record.Durations = newDurations;
				}
			} else if (editingType === 'lunch') {
				const [sh, sm] = editStartStr.split(':').map(Number);
				const [eh, em] = editEndStr.split(':').map(Number);
				if (!isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em)) {
					const start = new Date(record.date);
					start.setHours(sh, sm, 0, 0);
					const end = new Date(record.date);
					end.setHours(eh, em, 0, 0);
					record.lunchDuration = { start, end };
				}
			} else if (editingType === 'internal') {
				// Accept decimal hours, e.g. "1,5" or "2.25"
				let val = editInternalStr.trim();
				if (!val) {
					record.internalCompanyTime = 0;
				} else {
					val = val.replace(',', '.');
					let hours = parseFloat(val);
					if (!isNaN(hours)) {
						// Convert decimal hours to milliseconds
						record.internalCompanyTime = Math.round(hours * 3600000);
					} else {
						record.internalCompanyTime = 0;
					}
				}
			}
			await idb.set(record);
			records = records.map((r) => (r.key === record.key ? { ...record } : r));
			error = null;
		} catch (e) {
			error = 'Failed to update record.';
		}
		editingRecordId = null;
		editingType = null;
		editingIndex = null;
		editStartStr = '';
		editEndStr = '';
		editInternalStr = '';
	}

	function handleDelete(record: Keyed<TimeRecord>) {
		deleteRecord = record;
		confirmDialogOpen = true;
	}

	async function handleDeleteConfirm() {
		if (!deleteRecord) return;
		await idb.del(deleteRecord);
		records = records.filter((r) => !isSameDay(r.date, deleteRecord!.date));
		deleteRecord = null;
		confirmDialogOpen = false;
	}
</script>

<div class="mx-auto mt-8 w-full max-w-3xl">
	<h2 class="mb-4 text-xl font-semibold">History</h2>
	{#if loading}
		<div class="text-gray-500">Loading...</div>
	{:else if error}
		<div class="text-red-500">{error}</div>
	{:else if records.length === 0}
		<div class="text-gray-500">No history records found.</div>
	{:else}
		<div class="overflow-x-auto">
			<table class="min-w-full rounded-lg border border-gray-200 bg-white shadow">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
						<th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Durations</th>
						<th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Lunch</th>
						<th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Internal</th>
						<th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Work</th>
						<th class="px-4 py-2"></th>
					</tr>
				</thead>
				<tbody>
					{#each records as record}
						<HistoryRow
							{record}
							{editingRecordId}
							{editingType}
							{editingIndex}
							bind:editStartStr
							bind:editEndStr
							bind:editInternalStr
							onEditDuration={handleEditDuration}
							onEditLunch={handleEditLunch}
							onEditInternal={handleEditInternal}
							onEditSave={handleEditSave}
							onDelete={handleDelete}
							onEditCancel={() => {
								editingRecordId = null;
								editingType = null;
								editingIndex = null;
								editStartStr = '';
								editEndStr = '';
								editInternalStr = '';
							}}
						/>
					{/each}
				</tbody>
			</table>
			<ConfirmDialog
				open={confirmDialogOpen}
				message="Are you sure you want to delete this record? This action cannot be undone."
				onConfirm={handleDeleteConfirm}
				onCancel={() => (confirmDialogOpen = false)}
			/>
		</div>
	{/if}
</div>
