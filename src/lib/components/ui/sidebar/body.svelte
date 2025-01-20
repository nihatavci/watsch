<script lang="ts">
	import { cn } from '$lib/utils';
	import { getContext } from 'svelte';
	import { Menu, X } from 'lucide-svelte';
	import type { Writable } from 'svelte/store';

	interface SidebarContextProps {
		open: Writable<boolean>;
		currentPath: string;
	}

	export let className = '';

	const { open } = getContext<SidebarContextProps>('sidebar');
</script>

<div class="sidebar-base group">
	<div class="flex flex-col h-full">
		<slot />
	</div>
</div>

<style>
	:global(.sidebar-base) {
		height: 100vh;
		width: 60px;
		padding: 1rem 0.75rem;
		display: flex;
		flex-direction: column;
		background-color: rgba(10, 1, 24, 0.95);
		backdrop-filter: blur(20px);
		flex-shrink: 0;
		position: fixed;
		top: 0;
		left: 0;
		transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		z-index: 50;
	}

	:global(.sidebar-base:hover) {
		width: 240px;
	}

	@media (max-width: 768px) {
		:global(.sidebar-base) {
			display: none;
		}
	}
</style>

<!-- Mobile Sidebar -->
<div class="h-14 px-4 flex flex-row md:hidden items-center justify-between bg-[#181B18] w-full">
	<div class="flex justify-end z-20 w-full">
		<Menu class="text-[#9B9C9E] cursor-pointer w-5 h-5" on:click={() => open.set(!$open)} />
	</div>
	{#if $open}
		<div
			class={cn(
				'fixed h-full w-full inset-0 bg-[#181B18] p-4 z-[100] flex flex-col',
				className
			)}
		>
			<div
				class="absolute right-4 top-4 z-50 text-[#9B9C9E] cursor-pointer"
				on:click={() => open.set(!$open)}
			>
				<X class="w-5 h-5" />
			</div>
			<slot />
		</div>
	{/if}
</div> 