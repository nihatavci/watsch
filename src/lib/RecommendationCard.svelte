<script lang="ts">
	import { fade } from 'svelte/transition';
	import LoadingCard from './LoadingCard.svelte';
	import { library } from '../stores/library';
	import type { SavedItem, Recommendation } from './types';
	import { showNotification } from '../stores/notifications';

	export let recommendation: Recommendation;
	export let selectedPlatforms: string[] = [];
	export let onDismiss: () => void;
	export let index: number;

	const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
	let isAdded = false;
	let showRemoveButton = false;
	let showFullDescription = false;

	async function getRecommendationInfo() {
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

			if (!searchResponse.ok) {
				throw new Error(searchData.error || 'Failed to search media');
			}

			if (searchData.error) {
				throw new Error(searchData.error);
			}

			if (!searchData.results || searchData.results.length === 0) {
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
				throw new Error(detailsData.error || 'Failed to fetch details');
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
			throw new Error(error instanceof Error ? error.message : 'Failed to fetch movie details');
		}
	}

	let promise = getRecommendationInfo();

	function handleSave(data: any) {
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

	function handleRemove(data: any) {
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
		{#if data?.Title}
			<div in:fade|global class="relative flex bg-neutral-800/70 shadow-md rounded-xl backdrop-blur-gradient overflow-hidden">
				
				<!-- Poster -->
				{#if data.Poster}
					<div class="w-1/4 relative">
						<img 
							src={data.Poster} 
							alt={data.Title}
							class="w-full h-full object-cover"
						/>
						<div class="absolute inset-0 bg-gradient-to-r from-transparent to-neutral-800/50" />
					</div>
				{/if}

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
									<span class="px-1.5 py-0.5 rounded text-xs bg-red-500/20 text-red-500">
										{data.Rated}
									</span>
								{/if}
							</div>
						</div>
						{#if data.Rating}
							<div class="flex items-center bg-[#E50914] px-2 py-1 rounded">
								<span class="text-sm font-bold text-white">{data.Rating}%</span>
							</div>
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
							<span class="px-2 py-0.5 rounded-full text-xs bg-white/[0.05] text-white/70">
								{platform}
							</span>
						{/each}
						{#if data.Genre}
							{#each data.Genre.split(', ') as genre}
								<span class="px-2 py-0.5 rounded-full text-xs bg-white/[0.05] text-white/70">
									{genre}
								</span>
							{/each}
						{/if}
					</div>

					<!-- AI Insights -->
					{#if data.Insights?.length > 0}
						<div class="flex flex-wrap gap-1.5 mb-3">
							{#each data.Insights as insight}
								<span class="px-2 py-0.5 rounded-full text-xs bg-[#E50914]/10 text-[#E50914]">
									{insight}
								</span>
							{/each}
						</div>
					{/if}

					<!-- Action Button -->
					<div class="mt-auto">
						<button
							on:click={() => isAdded ? (showRemoveButton ? handleRemove(data) : null) : handleSave(data)}
							class="w-full px-3 py-1.5 rounded-lg bg-[#221F1F] border border-[#E50914]/20 text-white text-sm 
								transition-all duration-300 hover:bg-[#E50914] flex items-center justify-center gap-1.5"
						>
							{#if isAdded}
								{#if showRemoveButton}
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
									</svg>
									<span>Remove from List</span>
								{:else}
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
									</svg>
									<span>Added</span>
								{/if}
							{:else}
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
								</svg>
								<span>Save to Watch</span>
							{/if}
						</button>
					</div>
				</div>
			</div>
		{:else}
			<div in:fade|global class="relative bg-neutral-800/70 shadow-md p-4 rounded-xl backdrop-blur-gradient">
				<div class="flex flex-col">
					<div class="font-bold text-slate-200 text-xl mb-2">
						{recommendation.title}
					</div>
					<div class="text-sm text-slate-200/90">
						{recommendation.description}
					</div>
				</div>
			</div>
		{/if}
	{:catch error}
		<div class="p-4 rounded-xl bg-red-500/10 text-red-400">
			<div class="font-medium mb-1">Error loading recommendation details</div>
			<div class="text-sm opacity-90">
				{error.message === 'API authentication failed' 
					? 'Service temporarily unavailable. Please try again later.' 
					: error.message}
			</div>
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
