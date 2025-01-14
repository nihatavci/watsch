<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import LoadingCard from './LoadingCard.svelte';
	import { library } from '../stores/library';
	import type { SavedItem } from '../stores/library';
	import { showNotification } from '../stores/notifications';
	import Card from './ui/card.svelte';
	import CardContent from './ui/card-content.svelte';
	import Button from './ui/button.svelte';
	import Badge from './ui/badge.svelte';
	import { i18nStore } from './i18n';
	import GenreTag from './GenreTag.svelte';
	import { Share2, Download, Copy, Instagram, ExternalLink } from 'lucide-svelte';
	import type { Recommendation } from './types';

	export let recommendation: Recommendation;
	export let selectedPlatforms: string[] = [];
	export const onDismiss: () => void = () => {};
	export const index: number = 0;

	interface MovieDetails {
		Title: string;
		Year: string;
		Poster: string | null;
		Plot: string;
		Rated: string;
		Actors: string;
		Genre: string;
		Rating: number | null;
		Runtime: string | null;
		ReleaseDate: string;
		Insights: string[];
		Language: string | null;
		tmdbId: number | null;
		LocalizedData: {
			Title: string;
			Plot: string;
			Actors: string;
			Genre: string;
		};
		streamingLinks?: Array<{
			platform: string;
			url: string;
			type: string;
		}>;
	}

	const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
	let isAdded = false;
	let showRemoveButton = false;
	let showFullDescription = false;
	let loadingFailed = false;
	let showShareMenu = false;
	let isCopying = false;
	let isDownloading = false;

	async function translateWithChatGPT(text: string, targetLanguage: string): Promise<string> {
		try {
			const response = await fetch('/api/translate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					text,
					targetLanguage,
					context: 'movie_description'
				})
			});

			if (!response.ok) {
				throw new Error('Translation failed');
			}

			const data = await response.json();
			return data.translatedText;
		} catch (error) {
			console.error('Translation error:', error);
			return text; // Fallback to original text
		}
	}

	async function getRecommendationInfo(): Promise<MovieDetails | null> {
		try {
			const currentLang = $i18nStore.language;

			// Clean up the title by removing the genre in parentheses
			const cleanTitle = recommendation.title.replace(/\s*\([^)]*\)\s*$/, '').trim();

			console.log('Searching TMDB for:', cleanTitle); // Debug log

			// First search for the movie/show
			const searchResponse = await fetch(`/api/tmdb/search`, {
				method: 'POST',
				body: JSON.stringify({ 
					title: cleanTitle, // Use the cleaned title
					type: recommendation.type || 'movie',
					language: currentLang
				}),
				headers: {
					'content-type': 'application/json'
				}
			});

			const searchData = await searchResponse.json();

			// Debug log
			if (!searchData.results || searchData.results.length === 0) {
				console.log('No TMDB results for:', cleanTitle);
			} else {
				console.log('TMDB found:', searchData.results.length, 'results for', cleanTitle);
			}

			// Handle no results without throwing error
			if (!searchResponse.ok || !searchData.results || searchData.results.length === 0) {
				console.log('No results found for:', recommendation.title);
				return null;  // Return null instead of throwing error
			}

			// Get the first result's details
			const firstResult = searchData.results[0];

			// Get details in original language (English)
			const originalResponse = await fetch(`/api/tmdb/details`, {
				method: 'POST',
				body: JSON.stringify({ 
					id: firstResult.id,
					type: recommendation.type || 'movie',
					language: 'en'
				}),
				headers: {
					'content-type': 'application/json'
				}
			});

			const originalData = await originalResponse.json();

			// Get details in local language
			const localResponse = await fetch(`/api/tmdb/details`, {
				method: 'POST',
				body: JSON.stringify({ 
					id: firstResult.id,
					type: recommendation.type || 'movie',
					language: currentLang
				}),
				headers: {
					'content-type': 'application/json'
				}
			});

			const localData = await localResponse.json();

			if (!originalResponse.ok || !localResponse.ok) {
				loadingFailed = true;
				throw new Error('Failed to fetch details');
			}

			// If local language data is not available or incomplete, use ChatGPT to translate
			if (currentLang !== 'en' && (!localData.overview || !localData.title)) {
				const translatedTitle = !localData.title ? 
					await translateWithChatGPT(originalData.title || originalData.name, currentLang) :
					localData.title || localData.name;

				const translatedOverview = !localData.overview ?
					await translateWithChatGPT(originalData.overview, currentLang) :
					localData.overview;

				localData.title = translatedTitle;
				localData.overview = translatedOverview;
			}

			// Get AI-generated insights in the current language
			const insightsResponse = await fetch('/api/analyze-movie', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					title: localData.title || localData.name,
					overview: localData.overview,
					genres: localData.genres?.map((g: { name: string }) => g.name) || [],
					rating: localData.adult ? 'R' : 'PG-13',
					language: currentLang
				})
			});

			const insights = await insightsResponse.json();

			const streamingResponse = await fetch('/api/streaming-availability', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					tmdbId: firstResult.id,
					type: recommendation.type || 'movie'
				})
			});

			const streamingData = await streamingResponse.json();

			// Construct the movie details with both original and localized data
			const details: MovieDetails = {
				Title: originalData.title || originalData.name,
				Year: new Date(originalData.release_date || originalData.first_air_date).getFullYear().toString(),
				Poster: originalData.poster_path ? `${TMDB_IMAGE_BASE_URL}${originalData.poster_path}` : null,
				Plot: localData.overview || originalData.overview,
				Rated: originalData.adult ? 'R' : 'PG-13',
				Actors: localData.credits?.cast?.slice(0, 4).map((actor: { name: string }) => actor.name).join(', ') || '',
				Genre: localData.genres?.map((genre: { name: string }) => genre.name).join(', ') || '',
				Rating: originalData.vote_average ? Math.round(originalData.vote_average * 10) : null,
				Runtime: originalData.runtime ? `${originalData.runtime} ${$i18nStore.t('recommendations.minutes')}` : null,
				ReleaseDate: originalData.release_date || originalData.first_air_date,
				Insights: insights.insights || [],
				Language: originalData.original_language?.toUpperCase() || null,
				tmdbId: firstResult.id,
				LocalizedData: {
					Title: localData.title || localData.name,
					Plot: localData.overview || originalData.overview,
					Actors: localData.credits?.cast?.slice(0, 4).map((actor: { name: string }) => actor.name).join(', ') || '',
					Genre: localData.genres?.map((genre: { name: string }) => genre.name).join(', ') || ''
				},
				streamingLinks: streamingData.streamingLinks || []
			};

			return details;
		} catch (error) {
			console.error('Error fetching movie details:', error);
			return null;  // Return null on error
		}
	}

	let promise = getRecommendationInfo();

	// Refresh data when language changes
	$: if ($i18nStore.language) {
		promise = getRecommendationInfo();
	}

	function handleSave(data: MovieDetails) {
		if (!data?.Title || !data?.Year || !data?.Poster) {
			console.error('Missing required fields in media data:', data);
			return;
		}

		// Ensure 'year' is a string
		const yearString = typeof data.Year === 'number' ? data.Year.toString() : data.Year;

		const savedItem: SavedItem = {
			id: Date.now().toString(),
			title: data.Title,
			year: yearString,
			poster: data.Poster,
			platforms: selectedPlatforms,
			rating: data.Rating || null,
			genre: data.Genre || '',
			tmdbId: data.tmdbId?.toString() || ''
		};
		
		library.addToSaved(savedItem);
		showNotification($i18nStore.t('recommendations.added_to_watchlist', { title: data.Title }));
		isAdded = true;

		// Add pulse animation
		const card = document.querySelector('.recommendation-card');
		card?.classList.add('pulse-animation');
		setTimeout(() => {
			card?.classList.remove('pulse-animation');
			showRemoveButton = true;
		}, 2000);
	}

	function handleRemove(data: MovieDetails) {
		library.removeFromSaved(data.Title);
		showNotification($i18nStore.t('recommendations.removed_from_watchlist', { title: data.Title }));
		isAdded = false;
		showRemoveButton = false;
	}

	function toggleShareMenu() {
		showShareMenu = !showShareMenu;
	}

	async function downloadMovieCard(data: MovieDetails) {
		try {
			isDownloading = true;
			showNotification($i18nStore.t('share.downloading'));
			const response = await fetch('/api/generate-movie-card', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					title: data.LocalizedData.Title,
					year: data.Year,
					poster: data.Poster,
					rating: data.Rating,
					genre: data.Genre,
					runtime: data.Runtime,
					streamingLinks: data.streamingLinks
				})
			});
			
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${data.Title.replace(/\s+/g, '-')}-card.png`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);
			showNotification($i18nStore.t('share.download_complete'));
		} catch (error) {
			console.error('Error generating movie card:', error);
			showNotification($i18nStore.t('share.download_error'));
		} finally {
			isDownloading = false;
		}
	}

	function shareOnWhatsApp(data: MovieDetails) {
		const text = `${data.LocalizedData.Title} (${data.Year})\n${data.LocalizedData.Plot}\n${window.location.href}`;
		window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
	}

	function shareOnInstagram() {
		window.open('https://instagram.com', '_blank');
	}

	async function copyLink() {
		try {
			isCopying = true;
			await navigator.clipboard.writeText(window.location.href);
			showNotification($i18nStore.t('common.link_copied'));
			await new Promise(resolve => setTimeout(resolve, 1000));
		} catch (error) {
			console.error('Failed to copy:', error);
		} finally {
			isCopying = false;
		}
	}
</script>

<div class="recommendation-card relative rounded-xl text-white backdrop-blur-gradient">
	{#await promise}
		<LoadingCard />
	{:then data}
		{#if data?.Title && data?.Poster}
			<Card>
				<CardContent class="p-0">
					<div class="relative flex bg-neutral-800/70 shadow-md rounded-xl backdrop-blur-gradient overflow-hidden">
						<div class="w-1/4 relative">
							<img 
								src={data.Poster} 
								alt={data.Title}
								class="w-full h-full object-cover"
							/>
							<div class="absolute inset-0 bg-gradient-to-r from-transparent to-neutral-800/50" />
						</div>

						<!-- Content -->
						<div class="flex-1 p-6 flex flex-col min-h-[250px]">
							<!-- Header -->
							<div class="flex items-start justify-between mb-4">
								<div>
									<h2 class="text-xl font-bold text-white mb-1">
										{data.LocalizedData.Title}
										<span class="text-white/60 text-lg ml-2">{data.Year}</span>
									</h2>
									<div class="flex items-center gap-2 text-sm text-white/60">
										{#if data.Runtime}<span>{data.Runtime}</span>{/if}
										{#if data.Language}<span>{$i18nStore.t('recommendations.original_language')}: {data.Language}</span>{/if}
										{#if data.Rated}
											<Badge variant="destructive">
												{data.Rated}
											</Badge>
										{/if}
									</div>
								</div>
								{#if data.Rating}
									<Badge variant="default">
										{data.Rating}%
									</Badge>
								{/if}
							</div>

							<!-- Plot -->
							<div class="mb-4">
								<p class="text-sm text-white/70 {showFullDescription ? '' : 'line-clamp-2'}">
									{data.LocalizedData.Plot}
								</p>
								{#if !showFullDescription}
									<button 
										on:click={() => showFullDescription = true}
										class="text-xs text-[#E50914] hover:text-[#B20710] transition-colors duration-300"
									>
										{$i18nStore.t('recommendations.read_more')}
									</button>
								{/if}
							</div>

							<!-- Cast -->
							{#if data.LocalizedData.Actors}
								<div class="text-xs text-white/50 mb-3">
									{$i18nStore.t('recommendations.cast')}: {data.LocalizedData.Actors}
								</div>
							{/if}

							<!-- Tags -->
							<div class="flex flex-wrap gap-2 mb-4">
								{#each selectedPlatforms as platform}
									<Badge variant="secondary">
										{platform}
									</Badge>
								{/each}
								{#if data.Genre}
									{#each data.Genre.split(', ') as genre}
										<GenreTag {genre} variant="secondary" />
									{/each}
								{/if}
							</div>

							<!-- AI Insights -->
							{#if data.Insights?.length > 0}
								<div class="flex flex-wrap gap-2 mb-4">
									{#each data.Insights as insight}
										<div class="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/20 border border-red-900/30 rounded-full text-xs text-red-400">
											<svg class="w-3.5 h-3.5 text-[#E50914]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
											</svg>
											{insight}
										</div>
									{/each}
								</div>
							{/if}

							<!-- Streaming Links -->
							{#if data.streamingLinks && data.streamingLinks.length > 0}
								<div class="mb-4">
									<h3 class="text-sm font-medium text-white/70 mb-3">
										{$i18nStore.t('recommendations.streaming')}:
									</h3>
									<div class="flex flex-wrap gap-2">
										{#each data.streamingLinks as link}
											<a
												href={link.url}
												target="_blank"
												rel="noopener noreferrer"
												class="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800/50 hover:bg-neutral-700/50 border border-white/10 rounded-full text-xs text-white/90 transition-colors duration-200"
											>
												<span>{link.platform}</span>
												<ExternalLink class="w-3 h-3" />
											</a>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Action Button -->
							<div class="mt-auto flex items-center gap-2">
								<Button
									variant={isAdded ? "ghost" : "default"}
									class={isAdded 
										? "flex-1 h-12 bg-neutral-800/50 hover:bg-neutral-700/50 text-white rounded-xl" 
										: "flex-1 h-12 bg-[#E50914] hover:bg-[#B20710] text-white rounded-xl"}
									on:click={() => isAdded ? (showRemoveButton ? handleRemove(data) : null) : handleSave(data)}
								>
									{#if isAdded}
										{showRemoveButton 
											? $i18nStore.t('recommendations.remove_from_watchlist')
											: $i18nStore.t('recommendations.added_to_watchlist_short')}
									{:else}
										{$i18nStore.t('recommendations.add_to_watchlist')}
									{/if}
								</Button>

								<!-- Share button -->
								<div class="relative flex items-center">
									<Button
										variant="ghost"
										class="h-12 w-12 bg-neutral-800/50 hover:bg-neutral-700/50 text-white rounded-xl transition-colors duration-200 flex items-center justify-center"
										on:click={toggleShareMenu}
									>
										<Share2 class="w-5 h-5" />
									</Button>

									<!-- Share menu -->
									{#if showShareMenu}
										<div
											class="absolute bottom-full right-0 mb-2 w-48 bg-neutral-800/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/10 overflow-hidden"
											transition:slide={{ duration: 150 }}
											on:mouseleave={() => showShareMenu = false}
										>
											<button
												class="w-full px-4 py-3 flex items-center gap-3 hover:bg-neutral-700/50 text-white/90 text-sm transition-colors duration-200"
												on:click={() => downloadMovieCard(data)}
												disabled={isDownloading}
											>
												{#if isDownloading}
													<div class="w-4 h-4 border-2 border-t-transparent border-white/90 rounded-full animate-spin" />
												{:else}
													<Download class="w-4 h-4" />
												{/if}
												{isDownloading ? $i18nStore.t('share.downloading') : $i18nStore.t('share.download_card')}
											</button>
											
											<button
												class="w-full px-4 py-3 flex items-center gap-3 hover:bg-neutral-700/50 text-white/90 text-sm transition-colors duration-200"
												on:click={() => shareOnWhatsApp(data)}
											>
												<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
													<path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM15.85 15.85L14.79 16.91C13.31 18.39 10.69 18.39 9.21 16.91L7.15 14.85C5.67 13.37 5.67 10.75 7.15 9.27L8.21 8.21C8.59 7.83 9.16 7.83 9.54 8.21L11.25 9.92C11.63 10.3 11.63 10.87 11.25 11.25L10.54 11.96C10.16 12.34 10.16 12.91 10.54 13.29L11.71 14.46C12.09 14.84 12.66 14.84 13.04 14.46L13.75 13.75C14.13 13.37 14.7 13.37 15.08 13.75L16.79 15.46C17.17 15.84 17.17 16.41 16.79 16.79L15.85 15.85Z"/>
												</svg>
												{$i18nStore.t('share.share_whatsapp')}
											</button>
											
											<button
												class="w-full px-4 py-3 flex items-center gap-3 hover:bg-neutral-700/50 text-white/90 text-sm transition-colors duration-200"
												on:click={shareOnInstagram}
											>
												<Instagram class="w-4 h-4" />
												{$i18nStore.t('share.share_instagram')}
											</button>
											
											<button
												class="w-full px-4 py-3 flex items-center gap-3 hover:bg-neutral-700/50 text-white/90 text-sm transition-colors duration-200"
												on:click={copyLink}
												disabled={isCopying}
											>
												<Copy class="w-4 h-4" />
												{isCopying ? $i18nStore.t('share.copied') : $i18nStore.t('share.copy_link')}
											</button>
										</div>
									{/if}
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		{:else}
			<div class="p-4 text-center text-white/50">
				{$i18nStore.t('recommendations.no_details')}
			</div>
		{/if}
	{:catch error}
		<div class="p-4 text-center text-red-400">
			{$i18nStore.t('recommendations.error.details')}
		</div>
	{/await}
</div>

<style>
	button {
		-webkit-tap-highlight-color: transparent;
	}

	.backdrop-blur-gradient {
		background: linear-gradient(
			to bottom,
			rgba(34, 31, 31, 0.8) 0%,
			rgba(34, 31, 31, 0.9) 50%,
			rgba(34, 31, 31, 0.95) 100%
		);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
	}

	.pulse-animation {
		animation: pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) 1;
	}

	@keyframes pulse {
		0%, 100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.05);
		}
	}
</style>
