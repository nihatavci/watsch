<script lang="ts">
	import { library } from '../stores/library';
	import { fade, fly } from 'svelte/transition';
	import { X } from 'lucide-svelte';
	import Button from './ui/button.svelte';

	$: isOpen = $library.isOpen;
	$: movies = $library.movies;
	$: isSelectionMode = $library.isSelectionMode;

	function handleMovieClick(movie: any) {
		if (isSelectionMode) {
			library.selectMovie(movie);
		}
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
		transition:fade={{ duration: 200 }}
		on:click={() => library.toggle()}
	/>
	<div
		class="fixed right-0 top-0 h-full w-full max-w-md bg-[#0f0f0f]/95 backdrop-blur-xl border-l border-white/10 p-6 z-50 overflow-y-auto"
		transition:fly={{ x: 400, duration: 200 }}
	>
		<div class="flex justify-between items-center mb-6">
			<h2 class="text-2xl font-bold text-white">
				{isSelectionMode ? 'Select a Movie' : 'Your Library'}
			</h2>
			<button
				class="text-white/50 hover:text-white/70 transition-colors"
				on:click={() => library.toggle()}
			>
				<X size={24} />
			</button>
		</div>

		{#if movies.length === 0}
			<p class="text-white/50 text-center py-8">
				Your library is empty. Add some movies from recommendations!
			</p>
		{:else}
			<div class="space-y-4">
				{#each movies as movie}
					<div
						class="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
						on:click={() => handleMovieClick(movie)}
					>
						<h3 class="font-medium text-white">{movie.title}</h3>
						<p class="text-sm text-white/50">{movie.description}</p>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if} 