<script lang="ts">
	import { Sun, Moon } from 'lucide-svelte';
	import { theme, toggleTheme } from '$lib/stores/theme';
</script>

<button
	on:click={toggleTheme}
	class="fixed bottom-4 right-4 p-3 rounded-full bg-white/80 dark:bg-black/40 border border-red-500/10 dark:border-red-500/20 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-black/60 transition-all duration-200 text-gray-900 dark:text-white"
	aria-label="Toggle theme"
>
	{#if $theme === 'dark'}
		<Sun class="w-5 h-5" />
	{:else}
		<Moon class="w-5 h-5" />
	{/if}
</button> 