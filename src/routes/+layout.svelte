<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../app.css';
	import PWAInstallBanner from '$lib/PWAInstallBanner.svelte';
	import { i18nStore } from '$lib/i18n';
	import Header from '$lib/Header.svelte';
	import Sidebar from '$lib/Sidebar.svelte';
	import FluidBackground from '$lib/FluidBackground.svelte';

	let isSidebarOpen = false;

	function handleToggleSidebar() {
		isSidebarOpen = !isSidebarOpen;
	}
</script>

<style>
	:global(html), :global(body) {
		overflow: visible !important;
	}

	:global(body) {
		background: transparent !important;
	}
</style>

<FluidBackground />
<div class="min-h-screen w-full relative">
	<!-- Main content -->
	<main class="relative pt-16">
		<slot />
	</main>

	<!-- Fixed elements -->
	<div class="fixed top-0 left-0 right-0 z-40">
		<Header on:toggleSidebar={handleToggleSidebar} />
	</div>

	<!-- Sidebar -->
	<div class="fixed inset-y-0 left-0 z-50">
		<Sidebar bind:isOpen={isSidebarOpen} />
	</div>

	<!-- PWA Install Banner -->
	<div class="fixed bottom-0 inset-x-0 z-50">
		<PWAInstallBanner />
	</div>
</div>

<svelte:head>
	<link rel="manifest" href="/manifest.json" />
	<meta name="theme-color" content="#E50914" />
	<meta name="mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
	<link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
	<link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512x512.png" />
</svelte:head>
  