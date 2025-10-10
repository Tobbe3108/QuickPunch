<script lang="ts">
	import type { Keyed } from './../utils/KeyValueService.ts';
	import { onMount } from 'svelte';
	import { idb } from '../utils/KeyValueService';
	import type { TimeRecord } from '../models/TimeRecord';
	import {
		format,
		isValid,
		compareDesc,
		isSameDay,
		addHours,
		addMinutes,
		differenceInMilliseconds,
		startOfDay
	} from 'date-fns';
	import { da } from 'date-fns/locale';
	// Removed EditSegmentModal, using inline editing instead
	import ConfirmDialog from './ConfirmDialog.svelte';

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
						<tr class="border-t align-top">
							<td class="px-4 py-2 whitespace-nowrap capitalize">
								{record.date ? format(record.date, 'PPPP', { locale: da }) : ''}
							</td>
							<td class="px-4 py-2 whitespace-nowrap">
								{#if record.Durations && record.Durations.length > 0}
									<ul class="space-y-1">
										{#each record.Durations as dur, idx}
											<li class="flex items-center gap-2">
												{#if editingRecordId === record.key && editingType === 'duration' && editingIndex === idx}
													<input
														type="text"
														class="w-14 rounded border px-1 text-xs"
														bind:value={editStartStr}
														placeholder="Start"
														aria-label="Edit start time"
														on:keydown={(e) => {
															if (e.key === 'Escape') {
																editingRecordId = null;
																editingType = null;
																editingIndex = null;
															}
														}}
														autofocus
													/>
													<span>-</span>
													<input
														type="text"
														class="w-14 rounded border px-1 text-xs"
														bind:value={editEndStr}
														placeholder="End"
														aria-label="Edit end time"
														on:keydown={(e) => {
															if (e.key === 'Escape') {
																editingRecordId = null;
																editingType = null;
																editingIndex = null;
															}
														}}
													/>
													<button
														class="ml-2 rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:outline-none"
														aria-label="Save duration"
														on:click={() => handleEditSave(record)}>Save</button
													>
													<button
														class="ml-1 rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:outline-none"
														aria-label="Cancel edit"
														on:click={() => {
															editingRecordId = null;
															editingType = null;
															editingIndex = null;
															editStartStr = '';
															editEndStr = '';
														}}>Cancel</button
													>
												{:else}
													<span>{formatTime(dur.start)} - {formatTime(dur.end)}</span>
													<button
														class="ml-2 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 focus:ring-2 focus:ring-blue-400 focus:outline-none"
														aria-label="Edit duration"
														on:click={() => handleEditDuration(record, idx)}>Edit</button
													>
												{/if}
											</li>
										{/each}
									</ul>
								{/if}
							</td>
							<td class="px-4 py-2 whitespace-nowrap">
								{#if editingRecordId === record.key && editingType === 'lunch'}
									<input
										type="text"
										class="w-14 rounded border px-1 text-xs"
										bind:value={editStartStr}
										placeholder="Start"
										aria-label="Edit lunch start"
										on:keydown={(e) => {
											if (e.key === 'Escape') {
												editingRecordId = null;
												editingType = null;
												editingIndex = null;
											}
										}}
										autofocus
									/>
									<span>-</span>
									<input
										type="text"
										class="w-14 rounded border px-1 text-xs"
										bind:value={editEndStr}
										placeholder="End"
										aria-label="Edit lunch end"
										on:keydown={(e) => {
											if (e.key === 'Escape') {
												editingRecordId = null;
												editingType = null;
												editingIndex = null;
											}
										}}
									/>
									<button
										class="ml-2 rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:outline-none"
										aria-label="Save lunch"
										on:click={() => handleEditSave(record)}>Save</button
									>
									<button
										class="ml-1 rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:outline-none"
										aria-label="Cancel edit"
										on:click={() => {
											editingRecordId = null;
											editingType = null;
											editingIndex = null;
											editStartStr = '';
											editEndStr = '';
										}}>Cancel</button
									>
								{:else}
									<span
										>{formatTime(record.lunchDuration?.start)} - {formatTime(
											record.lunchDuration?.end
										)}</span
									>
									<button
										class="ml-2 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 focus:ring-2 focus:ring-blue-400 focus:outline-none"
										aria-label="Edit lunch"
										on:click={() => handleEditLunch(record)}>Edit</button
									>
								{/if}
							</td>
							<td class="px-4 py-2 whitespace-nowrap">
								{#if editingRecordId === record.key && editingType === 'internal'}
									<input
										type="text"
										class="w-14 rounded border px-1 text-xs"
										bind:value={editInternalStr}
										placeholder="HH:mm"
										aria-label="Edit internal time"
										on:keydown={(e) => {
											if (e.key === 'Escape') {
												editingRecordId = null;
												editingType = null;
												editingIndex = null;
												editInternalStr = '';
											}
										}}
										autofocus
									/>
									<button
										class="ml-2 rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:outline-none"
										aria-label="Save internal time"
										on:click={() => handleEditSave(record)}>Save</button
									>
									<button
										class="ml-1 rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:outline-none"
										aria-label="Cancel edit"
										on:click={() => {
											editingRecordId = null;
											editingType = null;
											editingIndex = null;
											editInternalStr = '';
										}}>Cancel</button
									>
								{:else}
									<span
										>{typeof record.internalCompanyTime === 'number'
											? `${Math.floor(record.internalCompanyTime / 3600000)
													.toString()
													.padStart(2, '0')}:${Math.floor(
													(record.internalCompanyTime % 3600000) / 60000
												)
													.toString()
													.padStart(2, '0')}`
											: ''}</span
									>
									<button
										class="ml-2 rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 focus:ring-2 focus:ring-blue-400 focus:outline-none"
										aria-label="Edit internal time"
										on:click={() => handleEditInternal(record)}>Edit</button
									>
								{/if}
							</td>
							<td class="px-4 py-2 whitespace-nowrap"
								>{record.Durations ? record.Durations.length : 0}</td
							>
							<td class="flex flex-col gap-2 px-4 py-2 whitespace-nowrap">
								<button
									class="inline-flex items-center rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 focus:ring-2 focus:ring-red-400 focus:outline-none"
									aria-label="Delete record"
									on:click={() => handleDelete(record)}
								>
									Delete
								</button>
							</td>
						</tr>
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
