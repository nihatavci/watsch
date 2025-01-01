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

	let resetApp: () => void;

	function handleResetApp() {
		if (resetApp) resetApp();
	}

	inject({ mode: dev ? 'development' : 'production' });
</script>

<div class="min-h-screen w-full bg-[#000000]">
	<div class="fixed inset-0 bg-gradient-to-br from-[#221F1F] to-black/90 -z-10" />
	<Header on:toggleSidebar={handleToggleSidebar} on:resetApp={handleResetApp} />
	<slot {resetApp} />
	<Sidebar bind:isOpen={isSidebarOpen} />
</div>
  