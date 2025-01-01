<script lang="ts">
	import { fade } from 'svelte/transition';
	import LoadingCard from './LoadingCard.svelte';
	import { library } from '../stores/library';
	import type { SavedItem } from '../stores/library';
	import { showNotification } from '../stores/notifications';

	export let recommendation: { title: string; description: string };
	export let selectedPlatforms: string[] = [];
	export let onDismiss: () => void;

	async function getRecommendationInfo() {
		const response = await fetch('/api/getMediaDetails', {
				method: 'POST',
				body: JSON.stringify({ title: recommendation.title }),
				headers: {
					'content-type': 'application/json'
				}
			});
		const recommendationDetails = await response.json();
		return recommendationDetails;
	}

	let promise = getRecommendationInfo();

	let isAdded = false;

	function handleSave(data: any) {
		if (!data?.Title || !data?.Year || !data?.Poster) {
			console.error('Missing required fields in media data');
			return;
		}

		isAdded = true;
		const savedItem: SavedItem = {
			id: Date.now().toString(),
			title: data.Title,
			year: data.Year,
			poster: data.Poster,
			platforms: selectedPlatforms
		};
		
		library.addToSaved(savedItem);
		showNotification(`Added "${data.Title}" to your watch list`);
		
		setTimeout(() => {
			onDismiss();
		}, 1000);
	}
</script>

<div class="pt-20">
	{#await promise}
		<LoadingCard incomingStream={false} />
	{:then data}
		{#if data.Poster}
			<div in:fade|global class="relative flex flex-col md:flex-row bg-neutral-800/70 shadow-md p-6 rounded-xl">
				<button
					on:click={onDismiss}
					class="absolute top-4 right-4 p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
				>
					<svg class="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>

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

				<div class="z-40 flex flex-col justify-between md:ml-6 pt-32 md:pt-0">
					<div>
						<div class="flex items-end mb-4">
							<div class="font-bold text-slate-200 text-3xl">
								{data.Title}
								<span class="font-bold text-slate-200/60 text-xl ml-2">{data.Year}</span>
							</div>
						</div>
						<div class="text-slate-200/90 mb-4">
							{data.Plot}
						</div>
						<div class="text-slate-200/50 mb-4">
							Starring: {data.Actors}
						</div>
						<div class="flex flex-wrap gap-2 mb-4">
							{#each selectedPlatforms as platform}
								<span class="px-3 py-1 rounded-full text-xs bg-white/[0.05] text-white/70">
									{platform}
								</span>
							{/each}
						</div>
					</div>
					<div class="flex items-center justify-between">
						<div class="flex items-center">
							<div class="mr-4 py-1 px-2 rounded-full text-pink-600 border border-pink-600 text-xs">
								{data.Rated}
							</div>
						</div>
						<button
							on:click={() => handleSave(data)}
							class="px-4 py-2 rounded-lg bg-[#221F1F] border border-[#E50914]/20 text-[#FFFFFF] text-sm transition-all duration-300 hover:bg-[#E50914] relative overflow-hidden"
							disabled={isAdded}
						>
							{#if isAdded}
								<div class="flex items-center justify-center" in:fade>
									<svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
									</svg>
									Added
								</div>
							{:else}
								Save to Watch
							{/if}
						</button>
					</div>
				</div>
			</div>
		{:else}
			<div in:fade|global class="relative flex flex-col md:flex-row bg-neutral-800/70 shadow-md p-6 rounded-xl">
				<!-- Fallback content -->
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
			<div class="text-sm opacity-90">{error.message || 'An unexpected error occurred'}</div>
		</div>
	{/await}
</div>
