<script lang="ts">
	import type { Keyed } from '../utils/KeyValueService';
	import type { TimeRecord } from '../models/TimeRecord';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

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

<Dialog.Root {open}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Edit durations</Dialog.Title>
		</Dialog.Header>
		<div class="space-y-2">
			{#each durationsArr as d, i}
				<div class="flex items-center gap-2">
					<Input type="time" class="w-32" bind:value={d.startStr} aria-label={`Start ${i + 1}`} />
					<span>-</span>
					<Input type="time" class="w-32" bind:value={d.endStr} aria-label={`End ${i + 1}`} />
					<Button
						variant="ghost"
						size="sm"
						class="ml-2 text-destructive"
						onclick={() => durationsArr.splice(i, 1)}
					>
						Remove
					</Button>
				</div>
			{/each}
		</div>
		<Button
			variant="link"
			size="sm"
			class="mt-2"
			onclick={() => durationsArr.push({ startStr: '', endStr: '' })}
		>
			Add duration
		</Button>
		{#if error}
			<div class="mt-2 text-sm text-destructive">{error}</div>
		{/if}
		<Dialog.Footer class="mt-4">
			<Button variant="outline" onclick={onCancel}>Cancel</Button>
			<Button onclick={handleSave}>Save</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
