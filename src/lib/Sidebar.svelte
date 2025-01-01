<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { library } from '../stores/library';

	export let isOpen = false;
</script>

{#if isOpen}
	<button
		type="button"
		class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
		on:click={() => (isOpen = false)}
		on:keydown={(e) => e.key === 'Escape' && (isOpen = false)}
		transition:fade={{ duration: 200 }}
	/>

	<div
		class="fixed right-0 top-0 h-full w-80 bg-black/80 backdrop-blur-sm border-l border-white/10 z-50 p-6 overflow-y-auto"
		transition:fly={{ x: "100%", duration: 300 }}
	>
		<div class="flex justify-between items-center mb-8">
			<h2 class="text-xl font-bold text-white">Library</h2>
			<button
				on:click={() => (isOpen = false)}
				class="text-white/50 hover:text-white/80 transition-colors"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<div class="space-y-6">
			{#if $library.savedItems.length > 0}
				<div class="space-y-4">
					<h3 class="text-sm font-medium text-white/70">Saved Items</h3>
					{#each $library.savedItems as item}
						<div class="flex items-start space-x-4 bg-white/5 rounded-lg p-4 group">
							<div class="w-16 h-24 flex-none bg-cover bg-center rounded" style="background-image: url({item.poster})"></div>
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium text-white truncate">{item.title}</p>
								<p class="text-xs text-white/50">{item.year}</p>
								{#if item.platforms.length > 0}
									<div class="mt-2 flex flex-wrap gap-1">
										{#each item.platforms as platform}
											<span class="px-2 py-0.5 rounded text-[10px] bg-white/10 text-white/70">
												{platform}
											</span>
										{/each}
									</div>
								{/if}
							</div>
							<button
								class="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
								on:click={() => library.removeFromSaved(item.title)}
							>
								<svg class="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-white/50 text-center py-8">
					Your saved movies will appear here
				</div>
			{/if}
		</div>
	</div>
{/if} 