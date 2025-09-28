<script lang="ts">
	import { persistentStore } from '$lib/idbService';

	const counter = persistentStore<number>('counter', 0);
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

<div>
	<button on:click={() => counter.update((n) => n + 1)}>Increment</button>
	<button on:click={() => counter.update((n) => n - 1)}>Decrement</button>
	<p>Counter (persistent): {$counter}</p>
</div>
