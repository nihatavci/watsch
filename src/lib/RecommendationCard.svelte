<script lang="ts">
	import { fade } from 'svelte/transition';
	import LoadingCard from './LoadingCard.svelte';
	import { library } from '../stores/library';
	import type { SavedItem, Recommendation } from './types';
	import { showNotification } from '../stores/notifications';

	export let recommendation: Recommendation;
	export let selectedPlatforms: string[] = [];
	export let onDismiss: () => void;

	const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
	let isAdded = false;
	let showRemoveButton = false;

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

			return {
				Title: detailsData.title || detailsData.name,
				Year: new Date(detailsData.release_date || detailsData.first_air_date).getFullYear().toString(),
				Poster: detailsData.poster_path ? `${TMDB_IMAGE_BASE_URL}${detailsData.poster_path}` : null,
				Plot: detailsData.overview,
				Rated: detailsData.adult ? 'R' : 'PG-13',
				Actors: detailsData.credits?.cast?.slice(0, 4).map((actor: { name: string }) => actor.name).join(', ') || '',
				Genre: detailsData.genres?.map((genre: { name: string }) => genre.name).join(', ') || '',
				Rating: detailsData.vote_average ? Math.round(detailsData.vote_average * 10) : null
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

		// Show remove button after 2 seconds
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

<div class="mt-4 first:mt-0">
	{#await promise}
		<LoadingCard />
	{:then data}
		{#if data?.Title}
			<div in:fade|global class="relative flex flex-col md:flex-row bg-neutral-800/70 shadow-md p-6 rounded-xl">
				<button
					on:click={onDismiss}
					class="absolute top-4 right-4 p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
				>
					<svg class="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>

				{#if data.Poster}
					<div
						class="hidden md:block h-[250px] flex-none w-1/5 bg-cover bg-center rounded-lg"
						style={`background-image: url(${data.Poster})`}
					/>
					<div
						class="md:hidden z-10 absolute inset-0 bg-cover bg-center rounded-xl"
						style={`background-image: url(${data.Poster})`}
					>
						<div class="w-full h-full bg-black/80 backdrop-blur-sm rounded-xl" />
					</div>
				{/if}

				<div class="z-40 flex flex-col justify-between {data.Poster ? 'md:ml-6 pt-32 md:pt-0' : 'pt-0'}">
					<div>
						<div class="flex items-end mb-4">
							<div class="font-bold text-slate-200 text-3xl">
								{data.Title}
								<span class="font-bold text-slate-200/60 text-xl ml-2">{data.Year}</span>
							</div>
						</div>
						<div class="text-slate-200/90 mb-4">
							{data.Plot || recommendation.description}
						</div>
						{#if data.Actors}
							<div class="text-slate-200/50 mb-4">
								Starring: {data.Actors}
							</div>
						{/if}
						<div class="flex flex-wrap gap-2 mb-4">
							{#each selectedPlatforms as platform}
								<span class="px-3 py-1 rounded-full text-xs bg-white/[0.05] text-white/70">
									{platform}
								</span>
							{/each}
							{#if data.Genre}
								<span class="px-3 py-1 rounded-full text-xs bg-white/[0.05] text-white/70">
									{data.Genre}
								</span>
							{/if}
							{#if data.Rating}
								<span class="px-3 py-1 rounded-full text-xs bg-[#E50914]/20 text-[#E50914]">
									{data.Rating}% Match
								</span>
							{/if}
						</div>
					</div>
					<div class="flex items-center justify-between">
						{#if data.Rated}
							<div class="flex items-center">
								<div class="mr-4 py-1 px-2 rounded-full text-red-600 border border-red-600 text-xs">
									{data.Rated}
								</div>
							</div>
						{/if}
						<button
							on:click={() => isAdded ? (showRemoveButton ? handleRemove(data) : null) : handleSave(data)}
							class="px-4 py-2 rounded-lg bg-[#221F1F] border border-[#E50914]/20 text-[#FFFFFF] text-sm transition-all duration-300 hover:bg-[#E50914] relative overflow-hidden"
						>
							{#if isAdded}
								{#if showRemoveButton}
									<div class="flex items-center justify-center" in:fade>
										<svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
										</svg>
										Remove from List
									</div>
								{:else}
									<div class="flex items-center justify-center" in:fade>
										<svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
										</svg>
										Added
									</div>
								{/if}
							{:else}
								Save to Watch
							{/if}
						</button>
					</div>
				</div>
			</div>
		{:else}
			<div in:fade|global class="relative flex flex-col md:flex-row bg-neutral-800/70 shadow-md p-6 rounded-xl">
				<div class="z-40 flex flex-col justify-between md:ml-6">
					<div>
						<div class="flex items-end mb-4">
							<div class="font-bold text-slate-200 text-3xl">
								{recommendation.title}
								<span class="font-bold text-slate-200/60 text-xl ml-2">N/A</span>
							</div>
						</div>
						<div class="text-slate-200/90 mb-4">
							{recommendation.description}
						</div>
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
