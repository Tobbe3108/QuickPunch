<script lang="ts">
	let { open, startStr, endStr, setStartStr, setEndStr, onSave, onCancel } = $props();
	let error = $state('');

	function validate() {
		error = '';
		if (!startStr) {
			error = 'Start time is required.';
			return false;
		}
		if (endStr) {
			const [sh, sm] = startStr.split(':').map(Number);
			const [eh, em] = endStr.split(':').map(Number);
			const startMinutes = sh * 60 + sm;
			const endMinutes = eh * 60 + em;
			if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) {
				error = 'Invalid time format.';
				return false;
			}
			if (endMinutes <= startMinutes) {
				error = 'End time must be after start time.';
				return false;
			}
		}
		return true;
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
		<div class="w-80 rounded bg-white p-4">
			<h3 class="mb-2 font-semibold">Edit Segment</h3>
			<label class="mb-2 block">
				Start:
				<input
					type="time"
					class="input input-bordered w-full"
					bind:value={startStr}
					oninput={(e) => {
						const target = e.target as HTMLInputElement;
						setStartStr(target.value);
					}}
				/>
			</label>
			<label class="mb-2 block">
				End:
				<input
					type="time"
					class="input input-bordered w-full"
					bind:value={endStr}
					oninput={(e) => {
						const target = e.target as HTMLInputElement;
						setEndStr(target.value);
					}}
				/>
			</label>
			{#if error}
				<div class="mb-2 text-red-600">{error}</div>
			{/if}
			<div class="mt-4 flex gap-2">
				<button
					class="btn-primary"
					onclick={() => {
						if (validate()) onSave();
					}}>Save</button
				>
				<button class="btn-outline" onclick={onCancel}>Cancel</button>
			</div>
		</div>
	</div>
{/if}
