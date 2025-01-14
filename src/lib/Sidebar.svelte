<script lang="ts">
	import { sidebar } from '../stores/sidebar';
	import { X, Film, Heart } from 'lucide-svelte';
	import { fly } from 'svelte/transition';
	import { library } from '../stores/library';

	$: isOpen = $sidebar.isOpen;
	$: movies = $library.movies || [];
	$: savedItems = $library.saved || [];
	$: view = $sidebar.view;
</script>

{#if isOpen}
	<div
		class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
		on:click={() => sidebar.set({ isOpen: false, view: null })}
		transition:fly={{ duration: 200, opacity: 0 }}
	/>
	<div
		class="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0f0f0f] border-l border-white/10 z-50 overflow-hidden"
		transition:fly={{ x: 400, duration: 300 }}
	>
		<div class="flex flex-col h-full">
			<!-- Header -->
			<div class="flex items-center justify-between p-4 border-b border-white/10">
				<div class="flex items-center gap-3">
					{#if view === 'library'}
						<Film size={20} class="text-[#E50914]" />
						<h2 class="text-lg font-medium text-white">Your Movie List</h2>
					{:else if view === 'watchlist'}
						<Heart size={20} class="text-[#E50914]" />
						<h2 class="text-lg font-medium text-white">Your Watchlist</h2>
					{/if}
				</div>
				<button
					class="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
					on:click={() => sidebar.set({ isOpen: false, view: null })}
				>
					<X size={20} />
				</button>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto p-4">
				{#if view === 'library'}
					{#if movies.length > 0}
						<div class="grid grid-cols-2 gap-4">
							{#each movies as movie}
								<button
									class="relative group rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02]"
									style="aspect-ratio: 2/3;"
									on:click={() => {
										library.selectMovie(movie);
									}}
								>
									{#if movie.poster_path}
										<img
											src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
											alt={movie.title}
											class="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity"
										/>
									{/if}
									<div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
										<div class="absolute bottom-0 left-0 right-0 p-3">
											<h3 class="text-sm font-medium text-white group-hover:text-white/90">{movie.title}</h3>
											{#if movie.release_date}
												<p class="text-xs text-white/50 mt-1">{new Date(movie.release_date).getFullYear()}</p>
											{/if}
										</div>
									</div>
								</button>
							{/each}
						</div>
					{:else}
						<div class="text-center py-12">
							<p class="text-white/50">No movies saved yet</p>
						</div>
					{/if}
				{:else if view === 'watchlist'}
					{#if savedItems.length > 0}
						<div class="space-y-4">
							{#each savedItems as item}
								<div
									class="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
								>
									<h3 class="font-medium text-white">{item.title}</h3>
									<p class="text-sm text-white/50">{item.year}</p>
								</div>
							{/each}
						</div>
					{:else}
						<div class="text-center py-12">
							<p class="text-white/50">No items in your watchlist yet</p>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>
{/if} 