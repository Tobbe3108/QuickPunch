<script lang="ts">
	import type { Keyed } from '../utils/KeyValueService';
	import type { TimeRecord } from '../models/TimeRecord';

	let {
		open = false,
		record = null,
		durationIndex = null,
		onSave = undefined,
		onCancel = undefined
	}: {
		open?: boolean;
		record: Keyed<TimeRecord> | null;
		durationIndex?: number | null;
		onSave?: (payload: {
			record: Keyed<TimeRecord>;
			mode: 'duration' | 'durations';
			durationIndex?: number | null;
			startStr?: string;
			endStr?: string;
			durations?: Array<{ startStr: string; endStr: string }>;
		}) => void;
		onCancel?: () => void;
	} = $props();

	let durationsArr = $state([] as Array<{ startStr: string; endStr: string }>);
	let error = $state('');

	$effect(() => {
		if (open && record) {
			const src = record.Durations ?? [];
			if (typeof durationIndex === 'number' && src[durationIndex]) {
				// edit single duration in-place
				const d = src[durationIndex];
				durationsArr = [
					{ startStr: d.start ? formatTime(d.start) : '', endStr: d.end ? formatTime(d.end) : '' }
				];
			} else {
				durationsArr = src.map((d) => ({
					startStr: d.start ? formatTime(d.start) : '',
					endStr: d.end ? formatTime(d.end) : ''
				}));
			}
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
		for (let i = 0; i < durationsArr.length; i++) {
			const s = durationsArr[i].startStr;
			const e = durationsArr[i].endStr;
			if (!s) {
				error = `Start time required for duration ${i + 1}`;
				return false;
			}
			if (e) {
				const [sh, sm] = s.split(':').map(Number);
				const [eh, em] = e.split(':').map(Number);
				if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) {
					error = `Invalid time for duration ${i + 1}`;
					return false;
				}
				if (eh * 60 + em <= sh * 60 + sm) {
					error = `End must be after start for duration ${i + 1}`;
					return false;
				}
			}
		}
		return true;
	}

	function handleSave() {
		if (!record) return;
		if (!validate()) return;
		if (typeof durationIndex === 'number') {
			// single duration save — send start/end and durationIndex
			const d = durationsArr[0] ?? { startStr: '', endStr: '' };
			onSave?.({ record, mode: 'duration', durationIndex, startStr: d.startStr, endStr: d.endStr });
		} else {
			onSave?.({ record, mode: 'durations', durations: durationsArr });
		}
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
			class="w-96 rounded bg-white p-4"
			role="dialog"
			aria-modal="true"
			aria-label="Edit durations"
		>
			<h3 class="mb-2 font-semibold">Edit durations</h3>
			<div class="space-y-2">
				{#each durationsArr as d, i}
					<div class="flex items-center gap-2">
						<input
							type="time"
							class="input input-bordered w-32"
							bind:value={d.startStr}
							aria-label={`Start ${i + 1}`}
						/>
						<span>-</span>
						<input
							type="time"
							class="input input-bordered w-32"
							bind:value={d.endStr}
							aria-label={`End ${i + 1}`}
						/>
						<button class="ml-2 text-sm text-red-600" onclick={() => durationsArr.splice(i, 1)}
							>Remove</button
						>
					</div>
				{/each}
			</div>
			<button
				class="mt-2 text-sm text-blue-600"
				onclick={() => durationsArr.push({ startStr: '', endStr: '' })}>Add duration</button
			>
			{#if error}
				<div class="mt-2 text-red-600">{error}</div>
			{/if}
			<div class="mt-4 flex gap-2">
				<button class="btn-primary" onclick={handleSave}>Save</button>
				<button class="btn-outline" onclick={onCancel}>Cancel</button>
			</div>
		</div>
	</div>
{/if}
