<script lang="ts">
	import type { Keyed } from './../utils/KeyValueService.ts';
	import { onMount } from 'svelte';
	import { idb } from '../utils/KeyValueService';
	import type { TimeRecord, Duration } from '../models/TimeRecord';
	import { compareDesc, isSameDay } from 'date-fns';
	import ConfirmDialog from './ConfirmDialog.svelte';
	import HistoryRow from './HistoryRow.svelte';
	import EditDurationsModal from './EditDurationsModal.svelte';
	import EditLunchModal from './EditLunchModal.svelte';
	import EditInternalModal from './EditInternalModal.svelte';

	let confirmDialogOpen = false;
	let deleteRecord: Keyed<TimeRecord> | null = null;

	let records: Keyed<TimeRecord>[] = [];
	let loading = true;
	let error: string | null = null;

	// Modal state
	let modalOpen = false;
	let modalRecord: Keyed<TimeRecord> | null = null;
	// Replace modalMode with explicit modal type flags for clarity
	let modalDurationsOpen = false; // used for both single-duration and all-durations
	let modalLunchOpen = false;
	let modalInternalOpen = false;
	let modalIdx: number | null = null; // duration index when editing a single duration

	function openEditModal(
		record: Keyed<TimeRecord>,
		mode: 'duration' | 'lunch' | 'internal',
		idx?: number | null
	) {
		modalRecord = record;
		modalIdx = idx ?? null;
		// Reset all flags then set the requested one
		modalDurationsOpen = false;
		modalLunchOpen = false;
		modalInternalOpen = false;
		if (mode === 'duration') modalDurationsOpen = true;
		else if (mode === 'lunch') modalLunchOpen = true;
		else if (mode === 'internal') modalInternalOpen = true;
		modalOpen = true;
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

	async function handleModalSave(payload: {
		record: Keyed<TimeRecord>;
		mode: string;
		durationIndex?: number | null;
		startStr?: string;
		endStr?: string;
		internalStr?: string;
		durations?: Array<{ startStr: string; endStr: string }>;
	}) {
		if (!payload || !payload.record) return;
		const record = payload.record;
		try {
			if (
				payload.mode === 'duration' &&
				typeof payload.durationIndex === 'number' &&
				record.Durations
			) {
				const idx = payload.durationIndex;
				const [sh, sm] = (payload.startStr ?? '').split(':').map(Number);
				const [eh, em] = (payload.endStr ?? '').split(':').map(Number);
				if (!isNaN(sh) && !isNaN(sm)) {
					const start = new Date(record.date);
					start.setHours(sh, sm, 0, 0);
					let end: Date | undefined = undefined;
					if (!isNaN(eh) && !isNaN(em)) {
						end = new Date(record.date);
						end.setHours(eh, em, 0, 0);
					}
					const newDurations = record.Durations.map((d, i) =>
						i === idx ? { ...d, start, end } : d
					);
					record.Durations = newDurations;
				}
			} else if (payload.mode === 'lunch') {
				const [sh, sm] = (payload.startStr ?? '').split(':').map(Number);
				const [eh, em] = (payload.endStr ?? '').split(':').map(Number);
				if (!isNaN(sh) && !isNaN(sm)) {
					const start = new Date(record.date);
					start.setHours(sh, sm, 0, 0);
					let end: Date | undefined = undefined;
					if (!isNaN(eh) && !isNaN(em)) {
						end = new Date(record.date);
						end.setHours(eh, em, 0, 0);
					}
					record.lunchDuration = { start, end };
				}
			} else if (payload.mode === 'internal') {
				let val = (payload.internalStr ?? '').trim();
				if (!val) {
					record.internalCompanyTime = 0;
				} else {
					val = val.replace(',', '.');
					let hours = parseFloat(val);
					if (!isNaN(hours)) {
						record.internalCompanyTime = Math.round(hours * 3600000);
					} else {
						record.internalCompanyTime = 0;
					}
				}
			} else if (payload.mode === 'durations' && Array.isArray(payload.durations)) {
				// Map incoming start/end strings to Dates and set record.Durations
				const newDurations = payload.durations
					.map((d) => {
						const [sh, sm] = (d.startStr ?? '').split(':').map(Number);
						const [eh, em] = (d.endStr ?? '').split(':').map(Number);
						if (isNaN(sh) || isNaN(sm)) return null;
						const start = new Date(record.date);
						start.setHours(sh, sm, 0, 0);
						let end: Date | undefined = undefined;
						if (!isNaN(eh) && !isNaN(em)) {
							end = new Date(record.date);
							end.setHours(eh, em, 0, 0);
						}
						return { start, end };
					})
					.filter(Boolean) as Duration[];

				record.Durations = newDurations;
			}
			await idb.set(record);
			records = records.map((r) => (r.key === record.key ? { ...record } : r));
			error = null;
		} catch (e) {
			error = 'Failed to update record.';
		}
		// close modal and reset flags
		modalOpen = false;
		modalRecord = null;
		modalDurationsOpen = false;
		modalLunchOpen = false;
		modalInternalOpen = false;
		modalIdx = null;
	}

	function handleModalCancel() {
		modalOpen = false;
		modalRecord = null;
		modalDurationsOpen = false;
		modalLunchOpen = false;
		modalInternalOpen = false;
		modalIdx = null;
	}

	async function handleModalDelete(recordToDel: Keyed<TimeRecord> | null) {
		if (!recordToDel) return;
		try {
			// clear lunch on the record and persist
			recordToDel.lunchDuration = undefined;
			await idb.set(recordToDel);
			records = records.map((r) => (r.key === recordToDel.key ? { ...recordToDel } : r));
			error = null;
		} catch (e) {
			error = 'Failed to delete lunch.';
		}
		// close modal
		modalOpen = false;
		modalRecord = null;
		modalDurationsOpen = false;
		modalLunchOpen = false;
		modalInternalOpen = false;
		modalIdx = null;
	}

	async function handleModalDeleteInternal(recordToDel: Keyed<TimeRecord> | null) {
		if (!recordToDel) return;
		try {
			// clear internalCompanyTime on the record and persist
			recordToDel.internalCompanyTime = undefined;
			await idb.set(recordToDel);
			records = records.map((r) => (r.key === recordToDel.key ? { ...recordToDel } : r));
			error = null;
		} catch (e) {
			error = 'Failed to delete internal time.';
		}
		// close modal
		modalOpen = false;
		modalRecord = null;
		modalDurationsOpen = false;
		modalLunchOpen = false;
		modalInternalOpen = false;
		modalIdx = null;
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
						<th class="px-4 py-2"></th>
					</tr>
				</thead>
				<tbody>
					{#each records as record}
						<HistoryRow {record} onOpenEdit={openEditModal} onDelete={handleDelete} />
					{/each}
				</tbody>
			</table>
			{#if modalDurationsOpen}
				<!-- If modalIdx is set we edit a single duration, otherwise edit all durations -->
				<EditDurationsModal
					open={modalOpen}
					record={modalRecord}
					durationIndex={modalIdx}
					onSave={handleModalSave}
					onCancel={handleModalCancel}
				/>
			{/if}
			{#if modalLunchOpen}
				<EditLunchModal
					open={modalOpen}
					record={modalRecord}
					onSave={handleModalSave}
					onCancel={handleModalCancel}
					onDelete={handleModalDelete}
				/>
			{/if}
			{#if modalInternalOpen}
				<EditInternalModal
					open={modalOpen}
					record={modalRecord}
					onSave={handleModalSave}
					onCancel={handleModalCancel}
					onDelete={handleModalDeleteInternal}
				/>
			{/if}
			<ConfirmDialog
				open={confirmDialogOpen}
				message="Are you sure you want to delete this record? This action cannot be undone."
				onConfirm={handleDeleteConfirm}
				onCancel={() => (confirmDialogOpen = false)}
			/>
		</div>
	{/if}
</div>
