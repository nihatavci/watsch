<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import { Sun, Moon } from 'lucide-svelte';
	import { cn } from '$lib/utils';
</script>

<header
	class="fixed inset-x-0 top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80"
>
	<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
		<div class="flex items-center">
			<a href="/" class="inline-flex items-center gap-2">
				<span class="font-bold text-xl">
					<span>Wat</span>
					<span class="text-[#E50914]">sch</span>
				</span>
			</a>
			<nav class="ml-6 hidden gap-6 text-sm font-medium lg:flex">
				<a
					class="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
					href="/discover">Discover</a
				>
				<a
					class="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
					href="/movie-night">Movie Night</a
				>
				<a
					class="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
					href="/recommendations">Recommendations</a
				>
			</nav>
		</div>
		<div class="flex items-center gap-6">
			<button
				on:click={() => {
					$theme = $theme === 'dark' ? 'light' : 'dark';
					if (window.navigator.vibrate) {
						window.navigator.vibrate(50);
					}
				}}
				class={cn(
					'p-2 rounded-full transition-all',
					$theme === 'light'
						? 'text-zinc-700 hover:text-zinc-900'
						: 'text-zinc-400 hover:text-white'
				)}
				aria-label="Toggle theme"
			>
				{#if $theme === 'dark'}
					<Sun class="w-5 h-5" />
				{:else}
					<Moon class="w-5 h-5" />
				{/if}
			</button>
			<a
				class="hidden rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 sm:inline-block"
				href="/login"
			>
				Login
			</a>
		</div>
	</div>
</header>
