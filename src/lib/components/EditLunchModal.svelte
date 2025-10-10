<script lang="ts">
	import type { Keyed } from '../utils/KeyValueService';
	import type { TimeRecord } from '../models/TimeRecord';
	import ConfirmDialog from './ConfirmDialog.svelte';

	let {
		open = false,
		record = null,
		onSave = undefined,
		onCancel = undefined,
		onDelete = undefined
	}: {
		open?: boolean;
		record: Keyed<TimeRecord> | null;
		onSave?: (payload: {
			record: Keyed<TimeRecord>;
			mode: 'lunch';
			startStr?: string;
			endStr?: string;
		}) => void;
		onCancel?: () => void;
		onDelete?: (record: Keyed<TimeRecord>) => void;
	} = $props();

	let startStr = $state('');
	let endStr = $state('');
	let error = $state('');
	let confirmOpen = $state(false);

	$effect(() => {
		if (open && record) {
			startStr = record.lunchDuration?.start ? formatTime(record.lunchDuration.start) : '';
			endStr = record.lunchDuration?.end ? formatTime(record.lunchDuration.end) : '';
			error = '';
		}
	});

	function formatTime(date: Date | undefined) {
		if (!date) return '';
		try {
			const hh = date.getHours().toString().padStart(2, '0');
			const mm = date.getMinutes().toString().padStart(2, '0');
			return `${hh}:${mm}`;
		} catch (e) {
			return '';
		}
	}

	function validate() {
		error = '';
		if (!startStr) {
			error = 'Start time is required.';
			return false;
		}
		if (endStr) {
			const [sh, sm] = startStr.split(':').map(Number);
			const [eh, em] = endStr.split(':').map(Number);
			if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) {
				error = 'Invalid time format.';
				return false;
			}
			if (eh * 60 + em <= sh * 60 + sm) {
				error = 'End must be after start.';
				return false;
			}
		}
		return true;
	}

	function handleSave() {
		if (!record) return;
		if (!validate()) return;
		onSave?.({ record, mode: 'lunch', startStr, endStr });
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
		onkeydown={(e) => e.key === 'Escape' && onCancel?.()}
		tabindex="-1"
		role="presentation"
	>
		<div class="w-80 rounded bg-white p-4" role="dialog" aria-modal="true" aria-label="Edit lunch">
			<h3 class="mb-2 font-semibold">Edit lunch</h3>
			<label class="mb-2 block">
				Start:
				<input type="time" class="input input-bordered w-full" bind:value={startStr} />
			</label>
			<label class="mb-2 block">
				End:
				<input type="time" class="input input-bordered w-full" bind:value={endStr} />
			</label>
			{#if error}
				<div class="mb-2 text-red-600">{error}</div>
			{/if}
			<div class="mt-4 flex gap-2">
				<button class="btn-primary" onclick={handleSave}>Save</button>
				<button class="btn-outline" onclick={onCancel}>Cancel</button>

				<button
					class="ml-auto inline-flex items-center rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 focus:ring-2 focus:ring-red-400 focus:outline-none"
					onclick={() => (confirmOpen = true)}
				>
					Delete
				</button>
			</div>
			<ConfirmDialog
				open={confirmOpen}
				message="Delete lunch? This cannot be undone."
				onConfirm={() => {
					onDelete && record && onDelete(record);
					confirmOpen = false;
					onCancel?.();
				}}
				onCancel={() => (confirmOpen = false)}
			/>
		</div>
	</div>
{/if}
