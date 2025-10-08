<script lang="ts">
	let { toast } = $props();
</script>

{#if toast}
	<div class="mt-2 text-green-600">{toast}</div>
{/if}
