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
			mode: 'internal';
			internalStr?: string;
		}) => void;
		onCancel?: () => void;
		onDelete?: (record: Keyed<TimeRecord>) => void;
	} = $props();

	let internalStr = $state('');
	let error = $state('');
	let confirmOpen = $state(false);

	$effect(() => {
		if (open && record) {
			if (typeof record.internalCompanyTime === 'number') {
				const totalMinutes = Math.floor(record.internalCompanyTime / 60000);
				const h = Math.floor(totalMinutes / 60);
				const m = totalMinutes % 60;
				internalStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
			} else {
				internalStr = '';
			}
			error = '';
		}
	});

	/**
	 * Parse user input into a decimal hours string (dot as decimal separator).
	 * Accepts:
	 * - HH:MM (e.g. "10:55")
	 * - messy decimals like "1./,25" -> "1.25"
	 * - normal decimal with "," or "."
	 * Returns normalized string (e.g. "1.25") or null if invalid.
	 */
	function parseToDecimalHoursString(input?: string): string | null {
		if (!input) return '';
		const raw = input.trim();
		if (raw === '') return '';

		// Try HH:MM first
		const hm = raw.match(/^\s*(\d{1,2}):?(\d{1,2})\s*$/);
		if (hm) {
			const hours = Number(hm[1]);
			const minutes = Number(hm[2]);
			if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes < 0 || minutes >= 60) return null;
			const decimal = hours + minutes / 60;
			// keep up to 4 decimal places to be safe
			return String(Number(decimal.toFixed(4))).replace(',', '.');
		}

		// Otherwise sanitize messy decimal input: keep digits, dot and comma
		let sanitized = raw.replace(/[^0-9.,]/g, '');
		if (!sanitized) return null;
		// Replace comma with dot
		sanitized = sanitized.replace(/,/g, '.');
		// Collapse multiple dots to a single dot (keep the first)
		const firstDot = sanitized.indexOf('.');
		if (firstDot !== -1) {
			sanitized =
				sanitized.slice(0, firstDot + 1) + sanitized.slice(firstDot + 1).replace(/\./g, '');
		}

		// Parse float
		const value = parseFloat(sanitized);
		if (Number.isNaN(value)) return null;
		return String(value).replace(',', '.');
	}

	function validate() {
		error = '';
		if (!internalStr) return true;
		const parsed = parseToDecimalHoursString(internalStr);
		if (parsed === null) {
			error = 'Invalid format. Use HH:MM or decimal hours (e.g. 1.25 or 1,25).';
			return false;
		}
		return true;
	}

	function handleSave() {
		if (!record) return;
		if (!validate()) return;
		// Convert to normalized decimal hours string before saving so
		// historyMutations.normaliseHours can safely parse it.
		const parsed = parseToDecimalHoursString(internalStr);
		if (parsed === null) return; // validate should have caught this
		onSave?.({ record, mode: 'internal', internalStr: parsed });
	}
</script>

<Dialog.Root {open}>
	<Dialog.Content class="sm:max-w-sm">
		<Dialog.Header>
			<Dialog.Title>Edit internal time</Dialog.Title>
		</Dialog.Header>
		<div class="space-y-4">
			<div class="space-y-2">
				<Label for="internal-time">Internal time</Label>
				<Input id="internal-time" type="time" bind:value={internalStr} />
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
	message="Delete internal time? This cannot be undone."
	onConfirm={() => {
		onDelete && record && onDelete(record);
		confirmOpen = false;
		onCancel?.();
	}}
	onCancel={() => (confirmOpen = false)}
/>
