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

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
		onkeydown={(e) => e.key === 'Escape' && onCancel?.()}
		tabindex="-1"
		role="presentation"
	>
		<div
			class="w-80 rounded bg-white p-4"
			role="dialog"
			aria-modal="true"
			aria-label="Edit internal time"
		>
			<h3 class="mb-2 font-semibold">Edit internal time</h3>
			<label class="mb-2 block">
				Internal time (decimal hours or HH:MM):
				<input type="text" class="input input-bordered w-full" bind:value={internalStr} />
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
				message="Delete internal time? This cannot be undone."
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
