<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../app.css';
	import { dev } from '$app/environment';
	import { inject } from '@vercel/analytics';
	import { onMount } from 'svelte';
	import Header from '$lib/Header.svelte';
	import Sidebar from '$lib/Sidebar.svelte';

	let isSidebarOpen = false;

	function handleToggleSidebar() {
		isSidebarOpen = !isSidebarOpen;
	}

	inject({ mode: dev ? 'development' : 'production' });
</script>

<div class="min-h-screen w-full">
	<Header on:toggleSidebar={handleToggleSidebar} />
	<slot />
	<Sidebar bind:isOpen={isSidebarOpen} />
</div>
  