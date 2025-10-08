<script lang="ts">
	let { open, message, onConfirm, onCancel } = $props();
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
		<div class="w-80 rounded bg-white p-4 shadow-lg">
			<h3 class="mb-2 font-semibold">Confirm Action</h3>
			<div class="mb-4 text-gray-700">{message}</div>
			<div class="flex justify-end gap-2">
				<button class="btn-primary" onclick={onConfirm}>Confirm</button>
				<button class="btn-outline" onclick={onCancel}>Cancel</button>
			</div>
		</div>
	</div>
{/if}
