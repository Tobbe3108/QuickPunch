<script lang="ts">
	import HistoryTable from '$lib/components/HistoryTable.svelte';
</script>

<main class="mx-auto mt-8 max-w-3xl rounded bg-white p-4 shadow">
	<h1 class="mb-4 text-xl font-bold">History</h1>
	<HistoryTable />
	<a
		href="/"
		class="mt-8 block w-full rounded bg-gray-200 py-2 text-center font-semibold text-gray-700 shadow transition hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:outline-none"
		>Back to Main</a
	>
</main>
