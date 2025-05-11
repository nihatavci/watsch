<script lang="ts">
	import { Sun, Moon } from 'lucide-svelte';
	import { theme, toggleTheme } from '$lib/stores/theme';
</script>

<button
	on:click={toggleTheme}
	class="fixed md:bottom-4 md:right-4 bottom-20 right-4 p-3 rounded-xl bg-black/40 border border-red-500/20 backdrop-blur-sm hover:bg-black/60 active:scale-95 transition-all duration-200 text-white/80 hover:text-white"
	aria-label="Toggle theme"
>
	{#if $theme === 'dark'}
		<Sun class="w-5 h-5" />
	{:else}
		<Moon class="w-5 h-5" />
	{/if}
</button>
