<script lang="ts">
	import type { Keyed } from './../utils/KeyValueService.ts';
	import { onMount } from 'svelte';
	import { idb } from '../utils/KeyValueService';
	import type { TimeRecord } from '../models/TimeRecord';
	import { compareDesc } from 'date-fns';
	import ConfirmDialog from './ConfirmDialog.svelte';
	import HistoryRow from './HistoryRow.svelte';
	import EditDurationsModal from './EditDurationsModal.svelte';
	import EditLunchModal from './EditLunchModal.svelte';
	import EditInternalModal from './EditInternalModal.svelte';
	import {
		replaceDurations,
		updateInternal,
		updateLunch,
		updateSingleDuration
	} from '../utils/historyMutations.js';

	type ModalState =
		| { kind: 'none' }
		| { kind: 'durations'; record: Keyed<TimeRecord>; index: number | null }
		| { kind: 'lunch'; record: Keyed<TimeRecord> }
		| { kind: 'internal'; record: Keyed<TimeRecord> };

	type ConfirmState = { open: false } | { open: true; record: Keyed<TimeRecord> };

	let records = $state([] as Array<Keyed<TimeRecord>>);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let modalState = $state<ModalState>({ kind: 'none' });
	const isModalOpen = $derived(() => modalState.kind !== 'none');
	const showDurationsModal = $derived(() => modalState.kind === 'durations');
	const showLunchModal = $derived(() => modalState.kind === 'lunch');
	const showInternalModal = $derived(() => modalState.kind === 'internal');
	const modalRecord = $derived(() => (modalState.kind === 'none' ? null : modalState.record));
	const modalDurationIndex = $derived(() =>
		modalState.kind === 'durations' ? modalState.index : null
	);

	let confirmState = $state<ConfirmState>({ open: false });
	const confirmOpen = $derived(() => confirmState.open);

	onMount(async () => {
		await loadRecords();
	});

	async function loadRecords() {
		loading = true;
		try {
			const keys = await idb.keys();
			const fetched = await Promise.all(keys.map((key) => idb.get<TimeRecord>(String(key))));
			records = fetched
				.filter((record): record is Keyed<TimeRecord> => Boolean(record))
				.sort((a, b) => compareDesc(a.date, b.date));
			error = null;
		} catch (e) {
			error = 'Failed to load history.';
		} finally {
			loading = false;
		}
	}

	function openEditModal(
		record: Keyed<TimeRecord>,
		mode: 'duration' | 'lunch' | 'internal',
		index: number | null = null
	) {
		if (mode === 'duration') {
			modalState = { kind: 'durations', record, index };
		} else if (mode === 'lunch') {
			modalState = { kind: 'lunch', record };
		} else {
			modalState = { kind: 'internal', record };
		}
	}

	function closeModal() {
		modalState = { kind: 'none' };
	}

	async function handleModalSave(payload: {
		record: Keyed<TimeRecord>;
		mode: 'duration' | 'durations' | 'lunch' | 'internal';
		durationIndex?: number | null;
		startStr?: string;
		endStr?: string;
		internalStr?: string;
		durations?: Array<{ startStr: string; endStr: string }>;
	}) {
		if (!payload?.record) return;
		try {
			const updated = await updateRecord(payload.record.key, (target) => {
				if (payload.mode === 'duration') {
					return updateSingleDuration(
						target,
						payload.durationIndex ?? null,
						payload.startStr,
						payload.endStr
					);
				}

				if (payload.mode === 'durations') {
					return replaceDurations(target, payload.durations ?? []);
				}

				if (payload.mode === 'lunch') {
					return updateLunch(target, payload.startStr, payload.endStr);
				}

				return updateInternal(target, payload.internalStr);
			});

			if (updated) {
				closeModal();
			}
		} catch (e) {
			error = 'Failed to update record.';
		}
	}

	function handleModalCancel() {
		closeModal();
	}

	async function handleModalDelete(recordToClear: Keyed<TimeRecord> | null) {
		if (!recordToClear) return;
		try {
			const cleared = await updateRecord(recordToClear.key, (target) => {
				target.lunchDuration = undefined;
				return true;
			});

			if (cleared) {
				closeModal();
			}
		} catch (e) {
			error = 'Failed to delete lunch.';
		}
	}

	async function handleModalDeleteInternal(recordToClear: Keyed<TimeRecord> | null) {
		if (!recordToClear) return;
		try {
			const cleared = await updateRecord(recordToClear.key, (target) => {
				target.internalCompanyTime = undefined;
				return true;
			});

			if (cleared) {
				closeModal();
			}
		} catch (e) {
			error = 'Failed to delete internal time.';
		}
	}

	async function handleDeleteConfirm() {
		if (!confirmState.open) return;
		const record = confirmState.record;
		try {
			await idb.del(record);
			records = records.filter((r) => r.key !== record.key);
			error = null;
		} catch (e) {
			error = 'Failed to delete record.';
		}
		confirmState = { open: false };
	}

	async function updateRecord(
		key: string,
		mutate: (record: Keyed<TimeRecord>) => boolean | void
	): Promise<boolean> {
		const target = findRecord(key);
		if (!target) return false;

		const shouldPersist = mutate(target);
		if (shouldPersist === false) return false;

		await persist(target);
		error = null;
		return true;
	}

	async function persist(record: Keyed<TimeRecord>) {
		await idb.set($state.snapshot(record));
		records = records.map((item) => (item.key === record.key ? record : item));
	}

	function findRecord(key: string) {
		return records.find((record) => record.key === key) ?? null;
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
						<HistoryRow
							{record}
							onOpenEdit={openEditModal}
							onDelete={() => (confirmState = { open: true, record })}
						/>
					{/each}
				</tbody>
			</table>
			{#if showDurationsModal()}
				<EditDurationsModal
					open={isModalOpen()}
					record={modalRecord()}
					durationIndex={modalDurationIndex()}
					onSave={handleModalSave}
					onCancel={handleModalCancel}
				/>
			{/if}
			{#if showLunchModal()}
				<EditLunchModal
					open={isModalOpen()}
					record={modalRecord()}
					onSave={handleModalSave}
					onCancel={handleModalCancel}
					onDelete={handleModalDelete}
				/>
			{/if}
			{#if showInternalModal()}
				<EditInternalModal
					open={isModalOpen()}
					record={modalRecord()}
					onSave={handleModalSave}
					onCancel={handleModalCancel}
					onDelete={handleModalDeleteInternal}
				/>
			{/if}
			<ConfirmDialog
				open={confirmOpen()}
				message="Are you sure you want to delete this record? This action cannot be undone."
				onConfirm={handleDeleteConfirm}
				onCancel={() => (confirmState = { open: false })}
			/>
		</div>
	{/if}
</div>
