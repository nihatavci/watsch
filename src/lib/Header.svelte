<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { i18nStore } from './i18n';
	import LanguageSwitcher from './LanguageSwitcher.svelte';
	import { library } from '../stores/library';

	const dispatch = createEventDispatcher();
	let showPulse = false;
	let previousLibraryCount = $library.savedItems.length;

	function handleLogoClick() {
		dispatch('resetApp');
	}

	function handleToggleSidebar() {
		dispatch('toggleSidebar');
	}

	// Watch for library changes
	$: {
		if ($library.savedItems.length > previousLibraryCount) {
			showPulse = true;
			setTimeout(() => {
				showPulse = false;
			}, 2000);
		}
		previousLibraryCount = $library.savedItems.length;
	}
</script>

<header class="fixed top-0 left-0 right-0 bg-black/40 backdrop-blur-sm">
	<nav class="container mx-auto px-4 py-4 flex justify-between items-center">
		<a href="/" on:click={() => location.reload()} class="flex items-center transition-opacity">
			<span class="text-2xl font-bold text-white hover:text-[#E50914]">
				Wat<span class="text-[#E50914]">sch</span>
			</span>
		</a>

		<div class="flex items-center gap-3">
			<LanguageSwitcher />
			<div class="relative">
				<button
					on:click={handleToggleSidebar}
					class="h-[38px] w-[38px] flex items-center justify-center rounded-lg bg-[#E50914]/10 backdrop-blur-sm border border-[#E50914]/20 hover:bg-[#E50914] transition-all duration-300 text-[#E50914] hover:text-white group"
					aria-label={$i18nStore.t('navigation.library')}
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</button>
				{#if showPulse}
					<div class="absolute -top-1 -right-1 animate-ping-once">
						<div class="w-3 h-3 bg-[#E50914] rounded-full opacity-75"></div>
					</div>
				{/if}
			</div>
		</div>
	</nav>
</header>

<style>
	header {
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
		z-index: 50;
	}

	:global(.animate-ping-once) {
		animation: ping 1s cubic-bezier(0, 0, 0.2, 1);
	}

	@keyframes ping {
		75%, 100% {
			transform: scale(2);
			opacity: 0;
		}
	}
</style>
