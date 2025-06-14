<script lang="ts">
	import { Bookmark, X, Sparkles, Share2, Download, Instagram, Clock } from 'lucide-svelte';
	import { library } from '../../stores/library';
	import { fade, fly } from 'svelte/transition';
	import { watchLaterItems, watchLater } from '$lib/stores/watchLater';
	import { authStore } from '$lib/stores/auth';
	import { onMount } from 'svelte';
	import { i18nStore } from '$lib/i18n';

	$: savedMovies = $library.saved;
	$: watchLaterMovies = $watchLaterItems;
	
	let showShareCard = false;
	let selectedMovie: any = null;
	let activeTab: 'saved' | 'watchLater' = 'saved';
	let isAuthenticated = false;

	onMount(() => {
		// Check if user is authenticated to determine if we should show Watch Later tab
		const unsubscribe = authStore.subscribe(state => {
			isAuthenticated = state.isAuthenticated;
		});
		
		return unsubscribe;
	});

	function removeMovie(movieId: string) {
		library.removeFromSaved(movieId);
	}

	async function downloadMovie(movie: any) {
		// Create notification function at the beginning of our function
		const showNotification = (message: string, type: 'info' | 'error' = 'info') => {
			// Check if we have a notification function available
			if (typeof window !== 'undefined' && window.dispatchEvent) {
				window.dispatchEvent(
					new CustomEvent('notification', {
						detail: { message, type }
					})
				);
			} else {
				console.log(message);
			}
		};
		
		try {
			showNotification('Downloading movie card...');
			console.log('Starting movie card download for:', movie.title);
			
			// Ensure we have required fields
			if (!movie.title) {
				showNotification('Cannot download: Missing movie title', 'error');
				return;
			}
			
			// Prepare the data for the enhanced movie card
			const cardData = {
				title: movie.title,
				year: movie.year || '',
				poster: movie.poster || '/placeholder-movie.png',
				rating: movie.rating || '',
				genre: movie.genre || '',
				runtime: movie.runtime || '',
				overview: movie.overview || '',
				type: movie.type || 'movie',
				insights: movie.insights || [],
				language: movie.language || null,
				actors: movie.actors || '',
				streamingLinks: movie.streamingLinks || [],
				version: Date.now() // Cache-busting parameter
			};
			
			console.log('Card data prepared:', cardData);
			
			// Call our enhanced movie card generator API with 60 second timeout for movie card generation
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
			
			try {
				console.log('Sending request to generate movie card...');
				const response = await fetch(`/api/generate-movie-card?nocache=${Date.now()}`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Cache-Control': 'no-cache, no-store, must-revalidate',
						'Pragma': 'no-cache',
						'Expires': '0'
					},
					body: JSON.stringify(cardData),
					signal: controller.signal
				});
				
				// Clear the timeout
				clearTimeout(timeoutId);
				
				// Log response headers and status
				console.log('Response status:', response.status);
				console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
				
				if (!response.ok) {
					// Try to parse the error message
					let errorMessage;
					try {
						const errorData = await response.json();
						errorMessage = errorData.error || 'Unknown error';
						console.error('Error details:', errorData);
					} catch (e) {
						const errorText = await response.text();
						errorMessage = errorText || `HTTP error ${response.status}`;
						console.error('Error response text:', errorText);
					}
					showNotification(`Failed to generate movie card: ${errorMessage}`, 'error');
					throw new Error(`Failed to generate movie card: ${errorMessage}`);
				}
				
				// Process and download the image
				const blob = await response.blob();
				console.log('Received blob type:', blob.type, 'size:', blob.size);
				
				if (blob.size < 1000) {
					showNotification('Error: Generated image is too small or invalid', 'error');
					return;
				}
				
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				
				// Format filename
				const cleanTitle = movie.title.replace(/[^a-z0-9\s-]/gi, '').trim();
				const yearStr = movie.year ? `-${movie.year}` : '';
				a.download = `${cleanTitle}${yearStr}-Watsch.png`;
				
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				window.URL.revokeObjectURL(url);
				
				showNotification('Download complete');
			} catch (fetchError: unknown) {
				clearTimeout(timeoutId);
				if (fetchError instanceof Error && fetchError.name === 'AbortError') {
					showNotification('Download timed out. Please try again.', 'error');
				} else {
					const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
					showNotification(`Download failed: ${errorMessage}`, 'error');
				}
				console.error('Error fetching movie card:', fetchError);
			}
		} catch (error: unknown) {
			console.error('Error generating movie card:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			showNotification(`Failed to download movie card: ${errorMessage}`, 'error');
		}
	}

	function openShareCard(movie: any) {
		selectedMovie = movie;
		showShareCard = true;
	}

	function closeShareCard() {
		showShareCard = false;
		selectedMovie = null;
	}

	async function shareToInstagram(movie: any) {
		// Here you would implement the logic to generate and share the movie card image
		// For now, we'll just show what would be shared
		const shareData = {
			title: movie.title,
			text: `Check out ${movie.title} (${movie.year}) on Watsch!\n\nGenres: ${
				movie.genres?.join(', ') || 'N/A'
			}\nRating: ${movie.rating || 'N/A'}\n\n#Watsch #Movies #MovieRecommendations`,
			url: window.location.href
		};

		try {
			if (navigator.share) {
				await navigator.share(shareData);
			}
		} catch (err) {
			console.error('Error sharing:', err);
		}
	}

	function setActiveTab(tab: 'saved' | 'watchLater') {
		activeTab = tab;
	}
</script>

<div class="relative min-h-screen pt-16">
	<!-- Content -->
	<div class="relative z-10 max-w-4xl mx-auto px-4 py-6">
		<!-- Mobile-optimized header -->
		<div class="space-y-3 sm:space-y-4">
			<div class="flex items-center gap-2 text-red-500">
				<Bookmark class="w-5 h-5" />
				<span class="text-sm font-medium">{$i18nStore.t('saved.collection', 'Your Collection')}</span>
			</div>
			<h1 class="text-3xl sm:text-4xl md:text-5xl font-bold text-red-500">{$i18nStore.t('saved.title', 'Saved Movies & Shows')}</h1>
		</div>

		<!-- Tabs -->
		{#if isAuthenticated}
			<div class="mt-6 border-b border-gray-200 dark:border-gray-800">
				<div class="flex space-x-4">
					<button
						class={`py-2 px-1 border-b-2 font-medium text-sm ${
							activeTab === 'saved'
								? 'border-red-500 text-red-500'
								: 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
						}`}
						on:click={() => setActiveTab('saved')}
					>
						<div class="flex items-center gap-2">
							<Bookmark class="w-4 h-4" />
							<span>{$i18nStore.t('saved.tab_saved', 'Saved')}</span>
						</div>
					</button>
					<button
						class={`py-2 px-1 border-b-2 font-medium text-sm ${
							activeTab === 'watchLater'
								? 'border-red-500 text-red-500'
								: 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
						}`}
						on:click={() => setActiveTab('watchLater')}
					>
						<div class="flex items-center gap-2">
							<Clock class="w-4 h-4" />
							<span>{$i18nStore.t('saved.tab_watch_later', 'Watch Later')}</span>
						</div>
					</button>
				</div>
			</div>
		{/if}

		<!-- Saved Content -->
		{#if activeTab === 'saved'}
			{#if savedMovies.length === 0}
				<div
					class="mt-6 p-6 rounded-xl bg-gray-100 dark:bg-gray-800/40 border border-red-500/20 backdrop-blur-sm text-center"
				>
					<Sparkles class="w-6 h-6 text-red-500 mx-auto mb-2" />
					<p class="text-gray-600 dark:text-gray-300">
						{$i18nStore.t('saved.empty', 'Start saving movies and shows you want to watch later!')}
					</p>
					<p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
						{$i18nStore.t('saved.helper', 'Tap the bookmark icon on any movie to save it here')}
					</p>
				</div>
			{:else}
				<div class="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
					{#each savedMovies as movie}
						<div
							in:fade
							class="group relative aspect-[2/3] rounded-xl overflow-hidden border border-red-500/20 bg-gray-100 dark:bg-gray-800/40 backdrop-blur-sm"
						>
							<img
								src={movie.poster ? movie.poster : '/placeholder.png'}
								alt={movie.title}
								class="w-full h-full object-cover"
							/>
							<!-- Action Buttons -->
							<div
								class="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20"
							>
								<button
									on:click={() => openShareCard(movie)}
									class="p-2 rounded-lg bg-black/40 backdrop-blur-sm border border-red-500/20 text-white/60 hover:text-white hover:bg-black/60 transition-colors"
								>
									<Share2 class="w-4 h-4" />
								</button>
								<button
									on:click={() => downloadMovie(movie)}
									class="p-2 rounded-lg bg-black/40 backdrop-blur-sm border border-red-500/20 text-white/60 hover:text-white hover:bg-black/60 transition-colors"
								>
									<Download class="w-4 h-4" />
								</button>
								<button
									on:click={() => removeMovie(movie.id)}
									class="p-2 rounded-lg bg-black/40 backdrop-blur-sm border border-red-500/20 text-white/60 hover:text-white hover:bg-black/60 transition-colors"
								>
									<X class="w-4 h-4" />
								</button>
							</div>
							<!-- Movie Info -->
							<div
								class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
							>
								<div class="absolute inset-x-0 bottom-0 p-4">
									<h3 class="text-sm sm:text-base font-medium text-white mb-1 line-clamp-2">
										{movie.title}
									</h3>
									<p class="text-xs sm:text-sm text-white/60">{movie.year}</p>
								</div>
							</div>
						</div>
					{/each}
				</div>
				<!-- Mobile helper text -->
				<p class="text-xs text-gray-500 dark:text-gray-400 text-center mt-4 sm:hidden">
					{$i18nStore.t('saved.mobile_helper', 'Tap and hold to see movie details')}
				</p>
			{/if}
		{:else if activeTab === 'watchLater'}
			<!-- Watch Later Content -->
			{#if watchLaterMovies.length === 0}
				<div
					class="mt-6 p-6 rounded-xl bg-gray-100 dark:bg-gray-800/40 border border-red-500/20 backdrop-blur-sm text-center"
				>
					<Clock class="w-6 h-6 text-red-500 mx-auto mb-2" />
					<p class="text-gray-600 dark:text-gray-300">
						{$i18nStore.t('saved.watch_later_empty', 'Your Watch Later list is empty!')}
					</p>
					<p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
						{$i18nStore.t('saved.watch_later_helper', 'Click the clock icon on any movie or show to add it here')}
					</p>
				</div>
			{:else}
				<div class="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
					{#each watchLaterMovies as item}
						<div
							in:fade
							class="group relative aspect-[2/3] rounded-xl overflow-hidden border border-red-500/20 bg-gray-100 dark:bg-gray-800/40 backdrop-blur-sm"
						>
							<img
								src={item.poster ? item.poster : '/placeholder.png'}
								alt={item.title}
								class="w-full h-full object-cover"
							/>
							<!-- Action Buttons -->
							<div
								class="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20"
							>
								<button
									on:click={() => watchLater.remove(item.id, item.mediaType)}
									class="p-2 rounded-lg bg-black/40 backdrop-blur-sm border border-red-500/20 text-white/60 hover:text-white hover:bg-black/60 transition-colors"
								>
									<X class="w-4 h-4" />
								</button>
							</div>
							<!-- Movie Info -->
							<div
								class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
							>
								<div class="absolute inset-x-0 bottom-0 p-4">
									<h3 class="text-sm sm:text-base font-medium text-white mb-1 line-clamp-2">
										{item.title}
									</h3>
									<div class="flex justify-between items-center">
										<span class="text-xs text-gray-300">{item.year || 'Unknown'}</span>
										<span class="text-xs bg-red-500 text-white px-2 py-0.5 rounded">
											{item.mediaType === 'movie' ? $i18nStore.t('form.movie', 'Movie') : $i18nStore.t('form.tv_show', 'TV Show')}
										</span>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
		
		<!-- Share/Download Modal (same as before) -->
		{#if showShareCard && selectedMovie}
			<div
				class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
				on:click={closeShareCard}
				transition:fade
			>
				<div
					class="w-full max-w-md bg-black/80 border border-red-500/20 rounded-xl overflow-hidden backdrop-blur-xl"
					on:click|stopPropagation
					transition:fly={{ y: 20 }}
				>
					<!-- Movie Card Preview -->
					<div class="relative aspect-[4/5] w-full">
						<img
							src={selectedMovie.poster}
							alt={selectedMovie.title}
							class="w-full h-full object-cover"
						/>
						<div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent">
							<div class="absolute bottom-0 left-0 right-0 p-6">
								<h3 class="text-2xl font-bold text-white mb-2">{selectedMovie.title}</h3>
								<div class="flex flex-wrap gap-2 mb-3">
									{#each selectedMovie.genres || [] as genre}
										<span class="px-2 py-1 rounded-md bg-red-500/20 text-red-500 text-sm">{genre}</span>
									{/each}
								</div>
								<p class="text-white/60">
									{selectedMovie.year} • Rating: {selectedMovie.rating || 'N/A'}
								</p>
							</div>
						</div>
					</div>

					<!-- Share Options -->
					<div class="p-4 space-y-4">
						<button
							on:click={() => shareToInstagram(selectedMovie)}
							class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity"
						>
							<Instagram class="w-5 h-5" />
							<span>Share to Instagram</span>
						</button>
						<button
							on:click={closeShareCard}
							class="w-full px-4 py-3 rounded-xl border border-red-500/20 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
						>
							Cancel
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	@keyframes gradient {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}
	.animate-gradient {
		background-size: 200% auto;
		animation: gradient 8s linear infinite;
	}
</style>
