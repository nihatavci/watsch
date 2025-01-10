<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../app.css';
	import Header from '$lib/Header.svelte';
	import Sidebar from '$lib/Sidebar.svelte';
	import { sidebar } from '../stores/sidebar';
</script>

<div class="min-h-screen bg-[#0f0f0f]">
	<Header />
	<main class="pt-16">
		<slot />
	</main>
	<Sidebar />
</div>

<style>
	:global(body) {
		@apply bg-[#0f0f0f];
	}
</style>
  