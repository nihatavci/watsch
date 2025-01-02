<script lang="ts">
	import { fade } from 'svelte/transition';
	import LoadingCard from './LoadingCard.svelte';
	import { library } from '../stores/library';
	import type { SavedItem, Recommendation } from './types';
	import { showNotification } from '../stores/notifications';
	import Card from './ui/card.svelte';
	import CardContent from './ui/card-content.svelte';
	import Button from './ui/button.svelte';
	import Badge from './ui/badge.svelte';
	import { i18nStore } from './i18n';
	import GenreTag from './GenreTag.svelte';

	export let recommendation: Recommendation;
	export let selectedPlatforms: string[] = [];
	export let onDismiss: () => void;
	export let index: number;

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
		LocalizedData: {
			Title: string;
			Plot: string;
			Actors: string;
			Genre: string;
		};
	}

	const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
	let isAdded = false;
	let showRemoveButton = false;
	let showFullDescription = false;
	let loadingFailed = false;

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

	async function getRecommendationInfo(): Promise<MovieDetails> {
		try {
			const currentLang = $i18nStore.language;

			// First search for the movie/show
			const searchResponse = await fetch(`/api/tmdb/search`, {
				method: 'POST',
				body: JSON.stringify({ 
					title: recommendation.title,
					type: recommendation.type || 'movie',
					language: currentLang
				}),
				headers: {
					'content-type': 'application/json'
				}
			});

			const searchData = await searchResponse.json();

			if (!searchResponse.ok || !searchData.results || searchData.results.length === 0) {
				loadingFailed = true;
				throw new Error('No results found');
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
				LocalizedData: {
					Title: localData.title || localData.name,
					Plot: localData.overview || originalData.overview,
					Actors: localData.credits?.cast?.slice(0, 4).map((actor: { name: string }) => actor.name).join(', ') || '',
					Genre: localData.genres?.map((genre: { name: string }) => genre.name).join(', ') || ''
				}
			};

			return details;
		} catch (error) {
			console.error('Error fetching movie details:', error);
			loadingFailed = true;
			throw error;
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

		const savedItem: SavedItem = {
			id: Date.now().toString(),
			title: data.Title,
			year: data.Year,
			poster: data.Poster,
			platforms: selectedPlatforms,
			rating: data.Rating || null,
			genre: data.Genre || ''
		};
		
		library.addToSaved(savedItem);
		showNotification($i18nStore.t('recommendations.added_to_watchlist', { title: data.Title }));
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
</script>

<div class="relative rounded-xl text-white backdrop-blur-gradient">
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
						<div class="flex-1 p-4 flex flex-col min-h-[200px]">
							<!-- Header -->
							<div class="flex items-start justify-between mb-2">
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
							<div class="mb-3">
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
								<div class="text-xs text-white/50 mb-2">
									{$i18nStore.t('recommendations.cast')}: {data.LocalizedData.Actors}
								</div>
							{/if}

							<!-- Tags -->
							<div class="flex flex-wrap gap-1.5 mb-3">
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
								<div class="flex flex-wrap gap-1.5 mb-3">
									{#each data.Insights as insight}
										<Badge variant="outline">
											{insight}
										</Badge>
									{/each}
								</div>
							{/if}

							<!-- Action Button -->
							<div class="mt-auto">
								<Button
									variant={isAdded ? "ghost" : "default"}
									class={isAdded 
										? "w-full h-12 bg-neutral-800/50 hover:bg-neutral-700/50 text-white rounded-xl" 
										: "w-full h-12 bg-[#E50914] hover:bg-[#B20710] text-white rounded-xl"}
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
</style>
