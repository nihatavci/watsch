<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
</script>

<header class="fixed top-0 left-0 right-0 z-50 bg-[#141414]/80 backdrop-blur-md border-b border-white/5">
	<div class="max-w-7xl mx-auto px-4 py-4">
		<nav class="flex justify-between items-center">
			<!-- Logo -->
			<a href="/" class="flex items-center space-x-2 hover:opacity-80 transition-opacity">
				<span class="text-2xl font-bold text-white">wat<span class="text-[#E50914]">sch</span></span>
			</a>

			<!-- Library Button -->
			<button
				on:click={() => dispatch('toggleSidebar')}
				class="px-4 py-2 rounded-lg bg-[#E50914]/10 backdrop-blur-sm border border-[#E50914]/20 
					   hover:bg-[#E50914]/20 transition-all duration-300 text-white/90 hover:text-white"
			>
				Library
				<span class="ml-2">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</span>
			</button>
		</nav>
	</div>
</header>

<style>
	header {
		box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
	}
</style>
