<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import LoadingCard from './LoadingCard.svelte';
	import { library } from '../stores/library';
	import type { Recommendation } from './types';
	import { showNotification, showToast } from '../stores/notifications';
	import Card from './ui/card.svelte';
	import CardContent from './ui/card-content.svelte';
	import Button from './ui/button.svelte';
	import Badge from './ui/badge.svelte';
	import { i18nStore } from './i18n';
	import GenreTag from './GenreTag.svelte';
	import {
		Share2,
		Download,
		Copy,
		Instagram,
		ExternalLink,
		Clock,
		Sparkles,
		Star
	} from 'lucide-svelte';
	import type { SavedItem } from '../stores/library';
	import { createEventDispatcher } from 'svelte';
	import { pulseSavedIcon } from '../stores/ui';
	import WatchLaterButton from './components/ui/WatchLaterButton.svelte';
	import { onMount } from 'svelte';

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
	let pulseEffect = false;
	let isDark = false;

	const dispatch = createEventDispatcher();

	onMount(() => {
		isDark = document.documentElement.classList.contains('dark');
	});

	async function translateWithChatGPT(text: string, targetLanguage: string): Promise<string> {
		if (!text || !targetLanguage) {
			console.warn('translateWithChatGPT: Missing text or targetLanguage');
			return text;
		}
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

			const data = await response.json();

			if (!response.ok || data.error) {
				console.error('Translation error:', data.error || await response.text());
				return text; // Fallback to original text
			}

			return data.translation || text;
		} catch (error) {
			console.error('Translation error:', error);
			return text; // Fallback to original text
		}
	}

	async function getRecommendationInfo(): Promise<MovieDetails | null> {
		try {
			const currentLang = $i18nStore.language;
			const cleanTitle = recommendation.title.replace(/\s*\([^)]*\)\s*$/, '').trim();

			console.log('Fetching details for:', cleanTitle, 'in', currentLang);

			// First search for the movie/show
			const searchResponse = await fetch(
				`/api/tmdb/search?title=${encodeURIComponent(cleanTitle)}&type=${encodeURIComponent(
					recommendation.type || 'movie'
				)}&language=${encodeURIComponent(currentLang)}`
			);

			const searchData = await searchResponse.json();

			if (!searchResponse.ok || !searchData.results?.[0]) {
				console.error('No results found for:', cleanTitle);
				return null;
			}

			const firstResult = searchData.results[0];

			// Get both original and localized details in parallel
			const [originalResponse, localResponse] = await Promise.all([
				fetch(
					`/api/tmdb/details?id=${firstResult.id}&type=${
						recommendation.type || 'movie'
					}&language=en`
				),
				fetch(
					`/api/tmdb/details?id=${firstResult.id}&type=${
						recommendation.type || 'movie'
					}&language=${currentLang}`
				)
			]);

			const [originalData, localData] = await Promise.all([
				originalResponse.json(),
				localResponse.json()
			]);

			if (!originalResponse.ok || !localResponse.ok) {
				console.error('Failed to fetch details');
				return null;
			}

			// Debug log for date fields
			console.log('Date fields:', {
				release_date: originalData.release_date,
				first_air_date: originalData.first_air_date,
				type: recommendation.type
			});

			// If local language data is not available or incomplete, use ChatGPT to translate
			if (currentLang !== 'en' && (!localData.overview || !localData.title)) {
				const translatedTitle = !localData.title
					? await translateWithChatGPT(originalData.title || originalData.name, currentLang)
					: localData.title || localData.name;

				const translatedOverview = !localData.overview
					? await translateWithChatGPT(originalData.overview, currentLang)
					: localData.overview;

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
				Year: originalData.release_date
					? new Date(originalData.release_date).getFullYear().toString()
					: originalData.first_air_date
					? new Date(originalData.first_air_date).getFullYear().toString()
					: '',
				Poster: originalData.poster_path
					? `${TMDB_IMAGE_BASE_URL}${originalData.poster_path}`
					: null,
				Plot: localData.overview || originalData.overview,
				Rated: originalData.adult ? 'R' : 'PG-13',
				Actors:
					localData.credits?.cast
						?.slice(0, 4)
						.map((actor: { name: string }) => actor.name)
						.join(', ') || '',
				Genre: localData.genres?.map((genre: { name: string }) => genre.name).join(', ') || '',
				Rating: originalData.vote_average ? Math.round(originalData.vote_average * 10) : null,
				Runtime: originalData.runtime
					? `${originalData.runtime} ${$i18nStore.t('recommendations.minutes')}`
					: null,
				ReleaseDate: originalData.release_date || originalData.first_air_date,
				Insights: insights.insights || [],
				Language: originalData.original_language?.toUpperCase() || null,
				tmdbId: firstResult.id,
				LocalizedData: {
					Title: localData.title || localData.name,
					Plot: localData.overview || originalData.overview,
					Actors:
						localData.credits?.cast
							?.slice(0, 4)
							.map((actor: { name: string }) => actor.name)
							.join(', ') || '',
					Genre: localData.genres?.map((genre: { name: string }) => genre.name).join(', ') || ''
				},
				streamingLinks: streamingData.streamingLinks || []
			};

			return details;
		} catch (error) {
			console.error('Error fetching movie details:', error);
			return null; // Return null on error
		}
	}

	let promise = getRecommendationInfo();

	// Refresh data when language changes
	$: if ($i18nStore.language) {
		promise = getRecommendationInfo();
	}

	function handleSave(data: MovieDetails) {
		console.log('handleSave called with:', data); // Debugging
		if (!data?.Title) {
			console.error('Missing required fields in media data:', data);
			return;
		}

		// Extract year from ReleaseDate if Year is not available
		const year =
			data.Year || (data.ReleaseDate ? new Date(data.ReleaseDate).getFullYear().toString() : '');

		// Handle cases where selectedPlatforms might not be an array
		const platformsArray = Array.isArray(selectedPlatforms) ? selectedPlatforms : [];

		const savedItem: SavedItem = {
			id: Date.now().toString(),
			title: data.Title,
			year: year,
			poster: data.Poster || null,
			platforms: platformsArray,
			rating: data.Rating || null,
			genre: data.Genre || '',
			tmdbId: data.tmdbId?.toString() || ''
		};

		console.log('Adding to saved:', savedItem); // Check the value of savedItem

		library.addToSaved(savedItem);

		// Show traditional notification
		showNotification($i18nStore.t('recommendations.added_to_watchlist', { title: data.Title }));

		// Show toast notification
		showToast(
			$i18nStore.t('recommendations.added_to_saved', { title: data.Title }),
			'success',
			3000
		);

		// Trigger pulse animation on the Saved icon in navbar
		pulseSavedIcon();

		isAdded = true;

		setTimeout(() => {
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

			// Ensure we have all required data for consistent card generation
			const cardData = {
				title: data.LocalizedData.Title || data.Title,
				year:
					data.Year ||
					(data.ReleaseDate ? new Date(data.ReleaseDate).getFullYear().toString() : ''),
				poster: data.Poster || '/placeholder-movie.png',
				rating: data.Rating,
				genre: data.Genre,
				runtime: data.Runtime,
				streamingLinks: data.streamingLinks || [],
				overview: data.LocalizedData.Plot || data.Plot,
				type: recommendation.type || 'movie',
				insights: data.Insights || [],
				language: data.Language,
				actors: data.LocalizedData.Actors || data.Actors,
				version: Date.now() // Add a cache-busting timestamp
			};

			// Add additional debugging to track what data is being sent
			console.log('Card data being sent:', {
				...cardData,
				posterLength: cardData.poster ? cardData.poster.length : 0,
				hasInsights: Array.isArray(cardData.insights) && cardData.insights.length > 0,
				hasStreamingLinks: Array.isArray(cardData.streamingLinks) && cardData.streamingLinks.length > 0,
			});

			const response = await fetch('/api/generate-movie-card', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Cache-Control': 'no-cache',
					'Pragma': 'no-cache'
				},
				body: JSON.stringify(cardData)
			});

			if (!response.ok) {
				throw new Error('Failed to generate movie card');
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;

			// Format filename: "Movie-Title-2024-Watsch"
			const cleanTitle = cardData.title.replace(/[^a-z0-9\s-]/gi, '').trim();
			const yearStr = cardData.year ? `-${cardData.year}` : '';
			a.download = `${cleanTitle}${yearStr}-Watsch.png`;

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
			await new Promise((resolve) => setTimeout(resolve, 1000));
		} catch (error) {
			console.error('Failed to copy:', error);
		} finally {
			isCopying = false;
		}
	}

	function addToLibrary(data: MovieDetails) {
		if (!data?.Title) {
			console.error('Missing required fields in media data:', data);
			return;
		}

		// Extract year from ReleaseDate if Year is not available
		const year =
			data.Year || (data.ReleaseDate ? new Date(data.ReleaseDate).getFullYear().toString() : '');

		// Handle cases where selectedPlatforms might not be an array
		const platformsArray = Array.isArray(selectedPlatforms) ? selectedPlatforms : [];

		const savedItem: SavedItem = {
			id: Date.now().toString(),
			title: data.Title,
			year: year,
			poster: data.Poster || null,
			platforms: platformsArray,
			rating: data.Rating || null,
			genre: data.Genre || '',
			tmdbId: data.tmdbId?.toString() || ''
		};

		console.log('Adding to saved:', savedItem);

		library.addToSaved(savedItem);

		// Show traditional notification
		showNotification($i18nStore.t('recommendations.added_to_watchlist', { title: data.Title }));

		// Show toast notification
		showToast(
			$i18nStore.t('recommendations.added_to_saved', { title: data.Title }),
			'success',
			3000
		);

		// Trigger pulse animation on the Saved icon in navbar
		pulseSavedIcon();

		isAdded = true;

		setTimeout(() => {
			showRemoveButton = true;
		}, 2000);
	}
</script>

<div class="relative rounded-2xl overflow-hidden animate-fadeIn">
	{#await promise}
		<LoadingCard />
	{:then data}
		{#if data?.Title && data?.Poster}
			<Card class="border-0 overflow-hidden transform transition-transform hover:scale-[1.01] duration-500">
				<CardContent class="p-0">
					<div
						class="relative flex flex-col sm:flex-row min-h-[200px]  dark:bg-gradient-to-br dark:from-black/90 dark:to-gray-900/90 dark:backdrop-blur-sm dark:border dark:border-gray-800/80 dark:shadow-xl rounded-2xl overflow-hidden"
					>
						<!-- Image container with subtle hover effect -->
						<div
							class="w-full sm:w-2/5 lg:w-1/3 relative min-h-[300px] sm:min-h-full transition-transform duration-700 hover:scale-[1.02] overflow-hidden"
						>
							{#if data.Poster}
								<img
									src={data.Poster}
									alt={data.Title}
									class="absolute inset-0 w-full h-full object-cover transition-transform duration-10000 hover:scale-105"
									loading="lazy"
									on:error={(e: Event) => { 
										const target = e.currentTarget as HTMLImageElement;
										target.onerror = null; 
										target.src = '/placeholder-movie.png'; 
									}}
								/>
							{:else}
								<div class="absolute inset-0 bg-black flex items-center justify-center">
									<span class="text-gray-500">No image available</span>
								</div>
							{/if}
							
							<!-- Enhanced gradient overlay for better text contrast -->
							<div
								class="absolute inset-0 bg-gradient-to-b sm:bg-gradient-to-r from-black/10 via-black/40 to-black/90"
							/>

							<!-- Rating badge if exists -->
							{#if data.Rating}
								<div
									class="absolute top-4 left-4 flex items-center justify-center w-16 h-16 rounded-full bg-red-600 backdrop-blur-sm border-2 border-white/20 shadow-lg"
									in:fade={{ duration: 400, delay: 200 }}
								>
									<div class="font-bold text-xl">{data.Rating}%</div>
								</div>
							{/if}
						</div>

						<!-- Content with improved spacing and animations -->
						<div class="flex-1 p-5 sm:p-8 flex flex-col relative z-10">
							<!-- Header with better spacing -->
							<div class="flex items-start justify-between gap-3 mb-4">
								<div class="flex-1 min-w-0">
									<h2
										class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2"
									>
										{data.LocalizedData.Title}
										{#if data.Year || data.ReleaseDate}
											<span class="text-red-500 dark:text-red-400 text-lg sm:text-xl ml-2">
												({data.Year ||
													(data.ReleaseDate ? new Date(data.ReleaseDate).getFullYear() : '')})
											</span>
										{/if}
									</h2>
									<div
										class="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
									>
										{#if data.Runtime}<span
												class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E50914] text-white font-medium"
												><Clock class="w-3 h-3" /> {data.Runtime}</span
											>{/if}
										{#if data.Language}<span
												class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E50914] text-white font-medium"
												><span
													class="w-3 h-3 flex items-center justify-center text-xs bg-black/50 rounded-full"
													>🌐</span
												>
												{data.Language}</span
											>{/if}
										{#if data.Rated}
											<Badge variant="default" class="rounded-full px-2.5 py-0.5 font-medium">
												{data.Rated}
											</Badge>
										{/if}
									</div>
								</div>
							</div>

							<!-- Actor tags if available -->
							{#if data.Actors}
								<div class="mb-4 flex flex-wrap gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
									{#each data.Actors.split(', ').slice(0, 4) as actor}
										<span class="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
											{actor}
										</span>
									{/each}
								</div>
							{/if}

							<!-- Description with show more toggle -->
							{#if data.LocalizedData.Plot}
								<div class="relative mb-5">
									<p class="text-sm sm:text-base {showFullDescription ? '' : 'line-clamp-3'}">
									{data.LocalizedData.Plot}
								</p>
									{#if data.LocalizedData.Plot.length > 150}
								<button
									on:click={() => (showFullDescription = !showFullDescription)}
											class="mt-1 text-xs sm:text-sm text-red-500 dark:text-red-400 hover:underline focus:outline-none"
								>
											{showFullDescription ? 'Show less' : 'Show more'}
								</button>
									{/if}
							</div>
							{/if}

							<!-- Cast with improved styling -->
							{#if data.LocalizedData.Actors}
								<div class="text-sm text-gray-500 dark:text-gray-400 mb-4">
									<span class="font-medium text-gray-700 dark:text-gray-300"
										>{$i18nStore.t('recommendations.cast')}:</span
									>
									{data.LocalizedData.Actors}
								</div>
							{/if}

							<!-- Tags with better styling -->
							<div class="flex flex-wrap gap-2 mb-5">
								{#each selectedPlatforms as platform}
									<Badge
										variant="secondary"
										class="bg-gray-100 dark:bg-black hover:bg-gray-200 dark:hover:bg-gray-950 text-gray-700 dark:text-white"
									>
										{platform}
									</Badge>
								{/each}
								{#if data.Genre}
									{#each data.Genre.split(', ') as genre}
										<GenreTag {genre} variant="secondary" />
									{/each}
								{/if}
							</div>

							<!-- AI Insights with improved styling -->
							{#if data.Insights?.length > 0}
								<div class="mb-5">
									<h3
										class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2"
									>
										<Sparkles class="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
										{$i18nStore.t('recommendations.ai_insights')}:
									</h3>
									<div class="flex flex-wrap gap-2">
										{#each data.Insights as insight, i}
											<div
												class="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/20 rounded-full text-xs text-red-600 dark:text-red-300 shadow-sm transition-all duration-300 hover:scale-105"
												in:fade={{ delay: 100 * i, duration: 300 }}
											>
												<svg
													class="w-3.5 h-3.5 text-red-500 dark:text-red-400"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
													/>
												</svg>
												{insight}
											</div>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Streaming Links with improved styling -->
							{#if data.streamingLinks && data.streamingLinks.length > 0}
								<div class="mb-5">
									<h3
										class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2"
									>
										<Star class="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-400" />
										{$i18nStore.t('recommendations.streaming')}:
									</h3>
									<div class="flex flex-wrap gap-2">
										{#each data.streamingLinks as link, i}
											<a
												href={link.url}
												target="_blank"
												rel="noopener noreferrer"
												class="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-black hover:bg-gray-200 dark:hover:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-full text-xs text-gray-700 dark:text-gray-300 transition-all duration-300 hover:scale-105 hover:shadow-md"
												in:fade={{ delay: 50 * i, duration: 300 }}
											>
												<span>{link.platform}</span>
												<ExternalLink class="w-3 h-3" />
											</a>
										{/each}
									</div>
								</div>
							{/if}

							<!-- Action Button with improved styling -->
							<div class="mt-auto pt-4 flex items-center gap-3">
								<Button
									variant={isAdded ? 'ghost' : 'default'}
									class={isAdded
										? 'flex-1 h-12 bg-gray-100 dark:bg-black hover:bg-gray-200 dark:hover:bg-gray-950 text-gray-700 dark:text-white rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm'
										: 'flex-1 h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl border border-transparent dark:border-gray-800 hover:shadow-md transition-all duration-300 hover:translate-y-[-2px]'}
									on:click={() =>
										isAdded ? (showRemoveButton ? handleRemove(data) : null) : handleSave(data)}
								>
									{#if isAdded}
										{showRemoveButton
											? $i18nStore.t('recommendations.remove_from_watchlist')
											: $i18nStore.t('recommendations.added_to_watchlist_short')}
									{:else}
										{$i18nStore.t('recommendations.add_to_watchlist')}
									{/if}
								</Button>

								<!-- Add Watch Later button here -->
								{#if data.tmdbId}
									<WatchLaterButton 
										mediaId={data.tmdbId.toString()} 
										mediaType={(recommendation.type || 'movie') as 'movie' | 'tv'} 
										title={data.Title} 
										poster={data.Poster || ''} 
										year={data.Year ? parseInt(data.Year) : null}
										simple={true}
									/>
								{/if}

								<!-- Share button with improved styling -->
								<div class="relative flex items-center">
									<Button
										variant="ghost"
										class="h-12 w-12 bg-gray-100 dark:bg-black hover:bg-gray-200 dark:hover:bg-gray-950 text-gray-700 dark:text-white rounded-xl border border-gray-200 dark:border-gray-800 transition-all duration-300 flex items-center justify-center hover:scale-105"
										on:click={toggleShareMenu}
									>
										<Share2 class="w-5 h-5" />
									</Button>

									<!-- Enhanced share menu with improved styling -->
									{#if showShareMenu}
										<!-- svelte-ignore a11y-interactive-supports-focus -->
										<div
											role="menu"
											class="absolute bottom-full right-0 mb-2 w-60 bg-white dark:bg-black rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden"
											in:slide={{ duration: 200, axis: 'y' }}
											on:mouseleave={() => (showShareMenu = false)}
										>
											<!-- Primary download button -->
											<button
												class="w-full px-4 py-4 flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors duration-200"
												on:click={() => downloadMovieCard(data)}
												disabled={isDownloading}
											>
												{#if isDownloading}
													<div
														class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
													/>
												{:else}
													<Download class="w-5 h-5" />
												{/if}
												<span>{isDownloading
													? $i18nStore.t('share.downloading')
													: $i18nStore.t('share.download_card')}</span>
											</button>

											<!-- Divider -->
											<div class="w-full h-px bg-gray-200 dark:bg-gray-800"></div>
											
											<!-- Share section title -->
											<div class="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">
												{$i18nStore.t('share.share_via')}
											</div>
											
											<!-- Share options grid -->
											<div class="grid grid-cols-2 p-2 gap-2">
											<button
													class="px-3 py-2.5 flex items-center gap-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-950 text-gray-700 dark:text-gray-300 text-sm transition-colors duration-200"
												on:click={() => shareOnWhatsApp(data)}
											>
													<svg class="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
													<path
														d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM15.85 15.85L14.79 16.91C13.31 18.39 10.69 18.39 9.21 16.91L7.15 14.85C5.67 13.37 5.67 10.75 7.15 9.27L8.21 8.21C8.59 7.83 9.16 7.83 9.54 8.21L11.25 9.92C11.63 10.3 11.63 10.87 11.25 11.25L10.54 11.96C10.16 12.34 10.16 12.91 10.54 13.29L11.71 14.46C12.09 14.84 12.66 14.84 13.04 14.46L13.75 13.75C14.13 13.37 14.7 13.37 15.08 13.75L16.79 15.46C17.17 15.84 17.17 16.41 16.79 16.79L15.85 15.85Z"
													/>
												</svg>
													<span>WhatsApp</span>
											</button>

											<button
													class="px-3 py-2.5 flex items-center gap-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-950 text-gray-700 dark:text-gray-300 text-sm transition-colors duration-200"
												on:click={shareOnInstagram}
											>
													<Instagram class="w-4 h-4 text-purple-500" />
													<span>Instagram</span>
											</button>

											<button
													class="px-3 py-2.5 flex items-center gap-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-950 text-gray-700 dark:text-gray-300 text-sm transition-colors duration-200"
												on:click={copyLink}
												disabled={isCopying}
											>
													<Copy class="w-4 h-4 text-blue-500" />
													<span>{isCopying ? $i18nStore.t('share.copied') : $i18nStore.t('share.copy_link')}</span>
											</button>
												
												<!-- Spacer for grid alignment -->
												<div></div>
											</div>
										</div>
									{/if}
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		{:else}
			<div
				class="p-6 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-black rounded-2xl"
			>
				{$i18nStore.t('recommendations.no_details')}
			</div>
		{/if}
	{:catch error}
		<div
			class="p-6 text-center text-red-600 dark:text-red-400 bg-white dark:bg-black rounded-2xl"
		>
			<div class="flex flex-col items-center gap-3">
				<p>{$i18nStore.t('recommendations.error.details')}</p>
			</div>
		</div>
	{/await}
</div>

<style>
	button {
		-webkit-tap-highlight-color: transparent;
	}
	
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	.animate-fadeIn {
		animation: fadeIn 0.5s ease-out forwards;
	}
</style>
