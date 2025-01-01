<script lang="ts">
	import TvIcon from './TvIcon.svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function toggleSidebar() {
		dispatch('toggleSidebar');
	}

	function handleLogoClick() {
		window.location.href = '/';
	}
</script>

<div
	class="max-w-4xl mx-auto w-full flex md:flex-row flex-col items-center md:justify-between py-8 mb-12 border-b border-[#E50914]/20"
>
	<button on:click={handleLogoClick} class="flex items-center mb-4 md:mb-0 text-[#FFFFFF] hover:text-[#E50914] hover-transition">
		<TvIcon />
		<div class="text-2xl md:text-xl font-bold ml-2">wat<span class="text-[#E50914]">sch</span></div>
	</button>

	<button
		on:click={toggleSidebar}
		class="px-4 py-2 bg-[#221F1F] hover:bg-[#E50914] rounded-lg hover-transition flex items-center space-x-2 border border-[#E50914]/20"
	>
		<span class="text-sm text-[#FFFFFF]">Library</span>
		<svg class="w-5 h-5 text-[#FFFFFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M4 6h16M4 12h16m-7 6h7"
			/>
		</svg>
	</button>
</div>
