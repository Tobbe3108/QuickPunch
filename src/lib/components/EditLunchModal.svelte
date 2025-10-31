<script lang="ts">
	import type { Keyed } from '../utils/KeyValueService';
	import type { TimeRecord } from '../models/TimeRecord';
	import ConfirmDialog from './ConfirmDialog.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';

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

<Dialog.Root {open}>
	<Dialog.Content class="sm:max-w-sm">
		<Dialog.Header>
			<Dialog.Title>Edit lunch</Dialog.Title>
		</Dialog.Header>
		<div class="space-y-4">
			<div class="space-y-2">
				<Label for="lunch-start">Start</Label>
				<Input id="lunch-start" type="time" bind:value={startStr} />
			</div>
			<div class="space-y-2">
				<Label for="lunch-end">End</Label>
				<Input id="lunch-end" type="time" bind:value={endStr} />
			</div>
			{#if error}
				<div class="text-sm text-destructive">{error}</div>
			{/if}
		</div>
		<Dialog.Footer class="mt-4 flex-col gap-2 sm:flex-row sm:justify-between">
			<Button variant="destructive" size="sm" onclick={() => (confirmOpen = true)}>Delete</Button>
			<div class="flex gap-2">
				<Button variant="outline" onclick={onCancel}>Cancel</Button>
				<Button onclick={handleSave}>Save</Button>
			</div>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

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
