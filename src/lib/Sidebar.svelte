<script lang="ts">
	import { sidebar } from '../stores/sidebar';
	import { X, Film, Heart, Share2, Download, Copy, Instagram, ExternalLink } from 'lucide-svelte';
	import { fly, slide } from 'svelte/transition';
	import { library } from '../stores/library';
	import { showNotification } from '../stores/notifications';

	$: isOpen = $sidebar.isOpen;
	$: movies = $library.movies || [];
	$: savedItems = $library.saved || [];
	$: view = $sidebar.view;

	let activeShareMenu: string | null = null;
	let isCopying = false;
	let isDownloading = false;

	function toggleShareMenu(itemId: string) {
		activeShareMenu = activeShareMenu === itemId ? null : itemId;
	}

	async function copyLink() {
		try {
			isCopying = true;
			await navigator.clipboard.writeText(window.location.href);
			showNotification('Link copied to clipboard');
			await new Promise(resolve => setTimeout(resolve, 1000));
		} catch (error) {
			console.error('Failed to copy:', error);
		} finally {
			isCopying = false;
		}
	}

	function shareOnWhatsApp(title: string) {
		const text = `${title}\n${window.location.href}`;
		window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
	}

	function shareOnInstagram() {
		window.open('https://instagram.com', '_blank');
	}
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
									class="w-full p-14 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left group relative"
									style="background-image: url('https://image.tmdb.org/t/p/w500{item.poster}'); background-size: cover; background-position: center;"
								>
									<div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
										<div class="relative p-3 flex justify-between items-start">
											<div>
												<h3 class="font-medium text-white group-hover:text-white/90">{item.title}</h3>
												<p class="text-sm text-white/50">{item.year}</p>
											</div>
											<div class="flex items-center gap-2">
												<!-- Share Button -->
												<div class="relative">
													<button
														class="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
														on:click={() => toggleShareMenu(item.id)}
													>
														<Share2 class="w-4 h-4" />
													</button>

													{#if activeShareMenu === item.id}
														<div
															class="absolute top-full right-0 mt-2 w-48 bg-neutral-800/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/10 overflow-hidden z-50"
															transition:slide={{ duration: 150 }}
															on:mouseleave={() => activeShareMenu = null}
														>
															<button
																class="w-full px-4 py-3 flex items-center gap-3 hover:bg-neutral-700/50 text-white/90 text-sm transition-colors duration-200"
																on:click={() => shareOnWhatsApp(item.title)}
															>
																<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
																	<path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM15.85 15.85L14.79 16.91C13.31 18.39 10.69 18.39 9.21 16.91L7.15 14.85C5.67 13.37 5.67 10.75 7.15 9.27L8.21 8.21C8.59 7.83 9.16 7.83 9.54 8.21L11.25 9.92C11.63 10.3 11.63 10.87 11.25 11.25L10.54 11.96C10.16 12.34 10.16 12.91 10.54 13.29L11.71 14.46C12.09 14.84 12.66 14.84 13.04 14.46L13.75 13.75C14.13 13.37 14.7 13.37 15.08 13.75L16.79 15.46C17.17 15.84 17.17 16.41 16.79 16.79L15.85 15.85Z"/>
																</svg>
																Share on WhatsApp
															</button>
															<button
																class="w-full px-4 py-3 flex items-center gap-3 hover:bg-neutral-700/50 text-white/90 text-sm transition-colors duration-200"
																on:click={shareOnInstagram}
															>
																<Instagram class="w-4 h-4" />
																Share on Instagram
															</button>
															<button
																class="w-full px-4 py-3 flex items-center gap-3 hover:bg-neutral-700/50 text-white/90 text-sm transition-colors duration-200"
																on:click={copyLink}
																disabled={isCopying}
															>
																<Copy class="w-4 h-4" />
																{isCopying ? 'Copied!' : 'Copy Link'}
															</button>
														</div>
													{/if}
												</div>

												<!-- Delete Button -->
												<button
													class="p-2 text-white/50 hover:text-red-500 rounded-lg hover:bg-white/10 transition-colors"
													on:click={() => library.removeFromSaved(item.id)}
												>
													<X class="w-4 h-4" />
												</button>
											</div>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="text-center py-12">
							<p class="text-white/50">No items in your watchlist yet</p>
						</div>
					{/if}
				{:else}
					<div class="text-center py-12">
						<p class="text-white/50">Select a view from the menu</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if} 