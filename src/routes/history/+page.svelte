<script lang="ts">
	import HistoryTable from '$lib/components/HistoryTable.svelte';
	import { Button } from '$lib/components/ui/button';
</script>

<main class="mx-auto mt-8 max-w-3xl rounded bg-white p-4 shadow">
	<h1 class="mb-4 text-xl font-bold">History</h1>
	<HistoryTable />
	<Button href="/" variant="secondary" class="mt-8 w-full">Back to Main</Button>
</main>
