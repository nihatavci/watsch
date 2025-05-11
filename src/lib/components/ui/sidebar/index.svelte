<script lang="ts">
	import { cn } from '$lib/utils';
	import { createEventDispatcher, getContext, setContext } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import { page } from '$app/stores';
	import { Menu, X } from 'lucide-svelte';
	import { fade, fly } from 'svelte/transition';

	interface Links {
		label: string;
		href: string;
		icon: any;
	}

	interface SidebarContextProps {
		open: Writable<boolean>;
		currentPath: string;
	}

	export let open = false;

	const openStore = writable(open);
	$: openStore.set(open);

	$: setContext<SidebarContextProps>('sidebar', {
		open: openStore,
		currentPath: $page.url.pathname
	});

	const dispatch = createEventDispatcher();

	$: openStore.subscribe((value) => {
		dispatch('update:open', value);
	});

	function toggleMenu() {
		open = !open;
		if (open && window.navigator.vibrate) {
			window.navigator.vibrate(50);
		}
	}
</script>

<!-- Desktop Sidebar -->
<div class="sidebar-base group hidden md:flex">
	<div class="flex flex-col h-full">
		<slot />
	</div>
</div>

<!-- Mobile Menu Button -->
<button
	class="fixed top-4 right-4 z-50 p-3 rounded-xl bg-black/40 backdrop-blur-lg md:hidden text-white/60 hover:text-white border border-red-500/20 active:scale-95 transition-all"
	on:click={toggleMenu}
>
	{#if open}
		<X class="w-5 h-5" />
	{:else}
		<Menu class="w-5 h-5" />
	{/if}
</button>

<!-- Mobile Sidebar -->
{#if open}
	<div
		class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
		on:click={toggleMenu}
		transition:fade={{ duration: 200 }}
	/>
	<div
		class="fixed inset-y-0 left-0 w-[280px] bg-[#14142380] backdrop-blur-xl z-50 md:hidden p-6"
		transition:fly={{ x: -320, duration: 300, opacity: 1 }}
	>
		<div class="flex flex-col h-full">
			<slot />
		</div>
	</div>
{/if}

<style>
	:global(.sidebar-base) {
		height: 100vh;
		width: 60px;
		padding: 1rem 0.75rem;
		display: flex;
		flex-direction: column;
		background-color: rgba(20, 20, 35, 0.95);
		backdrop-filter: blur(20px);
		flex-shrink: 0;
		position: fixed;
		top: 0;
		left: 0;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		z-index: 50;
	}

	:global(.sidebar-base:hover) {
		width: 240px;
		box-shadow: 4px 0 15px rgba(0, 0, 0, 0.3);
	}

	@media (max-width: 768px) {
		:global(.sidebar-base) {
			display: none;
		}
	}
</style>
