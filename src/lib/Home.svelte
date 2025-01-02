<script lang="ts">
	import { i18nStore } from './i18n';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function handleClick() {
		dispatch('click');
	}
</script>

<div class="min-h-[calc(80vh-5rem)] w-full flex flex-col justify-center px-4">
	<div
		class="relative z-10 text-left md:text-left font-bold text-slate-200 text-4xl md:text-5xl mb-8 md:mb-16 w-full"
	>
		{$i18nStore.t('home.title')} <br class="hidden md:block" /> 
		<span class="text-[#E50914]">{$i18nStore.t('home.subtitle')}</span>
	</div>
	<div class="flex flex-wrap items-center mr-auto">
		<button
			on:click={handleClick}
			class="w-full md:w-auto text-center bg-[#E50914] hover:bg-[#B20710] mb-4 flex-none rounded-lg text-white font-medium py-3 px-6 mr-8 transition-colors duration-300"
		>
			{$i18nStore.t('home.cta')}
		</button>
	</div>
</div>

<style>
	/* Ensure the home content doesn't block the background */
	div {
		position: relative;
		z-index: 10;
	}
</style>
