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
	}

	const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
	let isAdded = false;
	let showRemoveButton = false;
	let showFullDescription = false;
	let loadingFailed = false;

	async function getRecommendationInfo(): Promise<MovieDetails> {
		try {
			// First search for the movie/show
			const searchResponse = await fetch(`/api/tmdb/search`, {
				method: 'POST',
				body: JSON.stringify({ 
					title: recommendation.title,
					type: recommendation.type || 'movie'
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
			const detailsResponse = await fetch(`/api/tmdb/details`, {
				method: 'POST',
				body: JSON.stringify({ 
					id: firstResult.id,
					type: recommendation.type || 'movie'
				}),
				headers: {
					'content-type': 'application/json'
				}
			});

			const detailsData = await detailsResponse.json();

			if (!detailsResponse.ok) {
				loadingFailed = true;
				throw new Error('Failed to fetch details');
			}

			// Get AI-generated insights
			const insightsResponse = await fetch('/api/analyze-movie', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					title: detailsData.title || detailsData.name,
					overview: detailsData.overview,
					genres: detailsData.genres?.map((g: { name: string }) => g.name) || [],
					rating: detailsData.adult ? 'R' : 'PG-13'
				})
			});

			const insights = await insightsResponse.json();

			return {
				Title: detailsData.title || detailsData.name,
				Year: new Date(detailsData.release_date || detailsData.first_air_date).getFullYear().toString(),
				Poster: detailsData.poster_path ? `${TMDB_IMAGE_BASE_URL}${detailsData.poster_path}` : null,
				Plot: detailsData.overview,
				Rated: detailsData.adult ? 'R' : 'PG-13',
				Actors: detailsData.credits?.cast?.slice(0, 4).map((actor: { name: string }) => actor.name).join(', ') || '',
				Genre: detailsData.genres?.map((genre: { name: string }) => genre.name).join(', ') || '',
				Rating: detailsData.vote_average ? Math.round(detailsData.vote_average * 10) : null,
				Runtime: detailsData.runtime ? `${detailsData.runtime} min` : null,
				ReleaseDate: detailsData.release_date || detailsData.first_air_date,
				Insights: insights.insights || [],
				Language: detailsData.original_language?.toUpperCase() || null
			};
		} catch (error) {
			console.error('Error fetching movie details:', error);
			loadingFailed = true;
			throw error;
		}
	}

	let promise = getRecommendationInfo();

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
		showNotification(`Added "${data.Title}" to your watch list`);
		isAdded = true;

		setTimeout(() => {
			showRemoveButton = true;
		}, 2000);
	}

	function handleRemove(data: MovieDetails) {
		library.removeFromSaved(data.Title);
		showNotification(`Removed "${data.Title}" from your watch list`);
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
										{data.Title}
										<span class="text-white/60 text-lg ml-2">{data.Year}</span>
									</h2>
									<div class="flex items-center gap-2 text-sm text-white/60">
										{#if data.Runtime}<span>{data.Runtime}</span>{/if}
										{#if data.Language}<span>{data.Language}</span>{/if}
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
									{data.Plot}
								</p>
								{#if !showFullDescription}
									<button 
										on:click={() => showFullDescription = true}
										class="text-xs text-[#E50914] hover:text-[#B20710] transition-colors duration-300"
									>
										Read more
									</button>
								{/if}
							</div>

							<!-- Cast -->
							{#if data.Actors}
								<div class="text-xs text-white/50 mb-2">
									Cast: {data.Actors}
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
										<Badge variant="secondary">
											{genre}
										</Badge>
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
									<div class="flex items-center justify-center w-full">
										{#if isAdded}
											{#if showRemoveButton}
												<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
												</svg>
												Remove from List
											{:else}
												<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
												</svg>
												Added to Watch
											{/if}
										{:else}
											<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
											</svg>
											Add to Watch
										{/if}
									</div>
								</Button>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		{/if}
	{:catch error}
		<div class="p-4 text-center text-white/60">
			<div class="mb-2">
				<svg class="w-12 h-12 mx-auto text-[#E50914]/50 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				No details available for this recommendation
			</div>
			<Button 
				variant="ghost" 
				on:click={onDismiss}
				class="mx-auto"
			>
				Dismiss
			</Button>
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
