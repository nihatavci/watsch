<script lang="ts">
	import TvIcon from './TvIcon.svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	function toggleSidebar() {
		dispatch('toggleSidebar');
	}
</script>

<div
	class="max-w-4xl mx-auto w-full flex md:flex-row flex-col items-center md:justify-between py-8 mb-12 border-b border-white/20"
>
	<button on:click class="flex items-center mb-4 md:mb-0 text-white/70">
		<TvIcon />
		<div class="text-2xl md:text-xl font-bold ml-2">wat<span style="color: #EF4444;">sch</span></div>
	</button>

	<button
		on:click={toggleSidebar}
		class="p-2 hover:bg-white/[0.05] rounded-lg transition-colors flex items-center space-x-2"
	>
		<span class="text-sm text-white/70">Library</span>
		<svg class="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M4 6h16M4 12h16m-7 6h7"
			/>
		</svg>
	</button>
</div>
