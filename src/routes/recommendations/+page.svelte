<script lang="ts">
	import { Film, Tv, Sparkles, Brain, Zap } from 'lucide-svelte';
	import Form from '$lib/Form.svelte';
	import RecommendationCard from '$lib/RecommendationCard.svelte';
	import { library } from '../../stores/library';
	import { fade, slide } from 'svelte/transition';
	import { i18nStore } from '$lib/i18n';

	interface Recommendation {
		title: string;
		description: string;
		type: 'movie' | 'tv';
	}

	let cinemaType: 'movie' | 'tv' | null = null;
	let selectedGenres: string[] = [];
	let selectedPlatforms: string[] = [];
	let preferences = '';
	let loading = false;
	let recommendations: Recommendation[] = [];
	let error: string | null = null;
	let isFormCollapsed = false;

	const genres = [
		'Action',
		'Adventure',
		'Animation',
		'Comedy',
		'Crime',
		'Documentary',
		'Drama',
		'Family',
		'Fantasy',
		'Horror',
		'Mystery',
		'Romance',
		'Sci-Fi',
		'Thriller'
	];

	const platforms = ['Netflix', 'Prime Video', 'Disney+', 'HBO Max', 'Apple TV+', 'Hulu'];

	async function getRecommendations() {
		try {
			loading = true;
			error = null;
			recommendations = [];

			const response = await fetch('/api/getRecommendation', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					searched: cinemaType + (selectedGenres.length > 0 ? `, ${selectedGenres.join(', ')}` : '') + 
						(selectedPlatforms.length > 0 ? ` on ${selectedPlatforms.join(', ')}` : '')
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to get recommendations');
			}

			const data = await response.json();
			if (!Array.isArray(data) || data.length === 0) {
				throw new Error('No recommendations found');
			}

			recommendations = data.map(item => ({
				...item,
				type: cinemaType // Ensure we use the selected type
			}));
			isFormCollapsed = true;

		} catch (error: unknown) {
			console.error('Error getting recommendations:', error);
			error = error instanceof Error ? error.message : 'Failed to get recommendations';
		} finally {
			loading = false;
		}
	}

	function dismissRecommendation(index: number) {
		recommendations = recommendations.filter((_, i) => i !== index);
	}

	function handleSubmit() {
		if (!cinemaType) return;
		getRecommendations();
	}

	function toggleForm() {
		isFormCollapsed = !isFormCollapsed;
	}
</script>

<div class="relative min-h-screen bg-[#0A0118] pt-16 pb-24">
	<!-- Gradient background -->
	<div class="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(220,38,38,0.15),rgba(255,255,255,0))] -z-20" />

	<!-- RetroGrid -->
	<div class="pointer-events-none fixed inset-0 overflow-hidden [perspective:200px] -z-10">
		<div class="absolute inset-0 [transform:rotateX(65deg)]">
			<div class="animate-grid [background-image:linear-gradient(to_right,rgba(220,38,38,0.1)_1px,transparent_0),linear-gradient(to_bottom,rgba(220,38,38,0.1)_1px,transparent_0)] [background-repeat:repeat] [background-size:50px_50px] [height:300vh] [inset:0%_0px] [margin-left:-200%] [transform-origin:100%_0_0] [width:600vw]" />
		</div>
		<div class="absolute inset-0 bg-gradient-to-t from-[#0A0118] to-transparent to-90%" />
	</div>

	<!-- Content -->
	<div class="relative z-20 w-full max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
		<div class="space-y-2 sm:space-y-3">
			<div class="flex items-center gap-2 text-red-500">
				<Sparkles class="w-4 h-4 sm:w-5 sm:h-5" />
				<span class="text-xs sm:text-sm font-medium">AI-Powered Recommendations</span>
			</div>
			<h1 class="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-white to-red-500 animate-gradient">
				Discover Your Next Favorite
			</h1>
			<p class="text-base sm:text-lg text-white/60 py-3 sm:py-5 max-w-2xl">
				Our AI understands your taste and finds the perfect movies for you.
			</p>
		</div>

		<div class="relative mt-4 sm:mt-6">
			{#if recommendations.length > 0}
				<button
					on:click={toggleForm}
					class="mb-3 sm:mb-4 px-3 sm:px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start"
				>
					<span>{isFormCollapsed ? 'Show Filters' : 'Hide Filters'}</span>
					<svg
						class="w-4 h-4 transform transition-transform {isFormCollapsed ? '' : 'rotate-180'}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				</button>
			{/if}

			{#if !isFormCollapsed || recommendations.length === 0}
				<div transition:slide={{ duration: 300 }}>
					<form class="space-y-4 sm:space-y-6" on:submit|preventDefault={handleSubmit}>
						<!-- Cinema Type -->
						<div class="grid grid-cols-2 gap-2 sm:gap-4">
							<button
								type="button"
								class="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border-2 transition-all {cinemaType === 'movie' ? 'border-red-500 bg-red-500/5' : 'border-red-500/20 hover:border-red-500/40 bg-black/40'}"
								on:click={() => (cinemaType = 'movie')}
							>
								<Film class="w-4 h-4 sm:w-5 sm:h-5 {cinemaType === 'movie' ? 'text-red-500' : 'text-white/60'}" />
								<span class="text-sm sm:text-base font-medium {cinemaType === 'movie' ? 'text-red-500' : 'text-white/60'}">Movie</span>
							</button>
							<button
								type="button"
								class="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border-2 transition-all {cinemaType === 'tv' ? 'border-red-500 bg-red-500/5' : 'border-red-500/20 hover:border-red-500/40 bg-black/40'}"
								on:click={() => (cinemaType = 'tv')}
							>
								<Tv class="w-4 h-4 sm:w-5 sm:h-5 {cinemaType === 'tv' ? 'text-red-500' : 'text-white/60'}" />
								<span class="text-sm sm:text-base font-medium {cinemaType === 'tv' ? 'text-red-500' : 'text-white/60'}">TV Show</span>
							</button>
						</div>

						<!-- Genres -->
						<div class="space-y-2">
							<label class="block text-sm sm:text-base font-medium text-white">Choose genres (optional)</label>
							<div class="flex flex-wrap gap-1.5 sm:gap-2">
								{#each genres as genre}
									<button
										type="button"
										class="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border-2 text-xs sm:text-sm transition-all {selectedGenres.includes(genre) ? 'border-red-500 bg-red-500/5 text-red-500' : 'border-red-500/20 text-white/60 hover:border-red-500/40 bg-black/40'}"
										on:click={() => {
											if (selectedGenres.includes(genre)) {
												selectedGenres = selectedGenres.filter((g) => g !== genre);
											} else {
												selectedGenres = [...selectedGenres, genre];
											}
										}}
									>
										{genre}
									</button>
								{/each}
							</div>
						</div>

						<!-- Platforms -->
						<div class="space-y-2">
							<label class="block text-sm sm:text-base font-medium text-white">Available on (optional)</label>
							<div class="flex flex-wrap gap-1.5 sm:gap-2">
								{#each platforms as platform}
									<button
										type="button"
										class="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border-2 text-xs sm:text-sm transition-all {selectedPlatforms.includes(platform) ? 'border-red-500 bg-red-500/5 text-red-500' : 'border-red-500/20 text-white/60 hover:border-red-500/40 bg-black/40'}"
										on:click={() => {
											if (selectedPlatforms.includes(platform)) {
												selectedPlatforms = selectedPlatforms.filter((p) => p !== platform);
											} else {
												selectedPlatforms = [...selectedPlatforms, platform];
											}
										}}
									>
										{platform}
									</button>
								{/each}
							</div>
						</div>

						<!-- Preferences -->
						<div class="space-y-2">
							<label class="block text-sm sm:text-base font-medium text-white">Any specific preferences? (optional)</label>
							<input
								type="text"
								bind:value={preferences}
								placeholder="e.g., 'with strong female lead', 'released after 2010'"
								class="w-full px-3 sm:px-4 py-2 rounded-lg border-2 border-red-500/20 bg-black/40 text-white placeholder-white/40 focus:outline-none focus:border-red-500/40 transition-colors text-xs sm:text-sm"
							/>
						</div>

						<!-- Submit -->
						<button
							type="submit"
							class="w-full py-2.5 sm:py-3 rounded-lg bg-gradient-to-r from-red-500 via-red-500 to-red-600 hover:shadow-xl hover:shadow-red-500/20 text-white font-medium text-sm sm:text-base transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2"
							disabled={!cinemaType || loading}
						>
							{#if loading}
								<div class="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
								<span>Finding the Perfect Match...</span>
							{:else}
								<Sparkles class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
								<span>Get AI Recommendations</span>
							{/if}
						</button>
					</form>
				</div>
			{/if}
		</div>

		{#if recommendations.length === 0}
			<div in:fade>
				{#if error}
					<div class="mt-4 p-3 sm:p-4 rounded-xl bg-red-500/10 text-red-400 text-sm sm:text-base">
						{error}
					</div>
				{/if}
			</div>
		{:else}
			<div class="mt-6 sm:mt-8 space-y-3 sm:space-y-4">
				{#each recommendations as recommendation, i}
					<RecommendationCard
						{recommendation}
						{selectedPlatforms}
						on:dismiss={() => dismissRecommendation(i)}
					/>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	@keyframes gradient {
		0% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
		100% { background-position: 0% 50%; }
	}
	.animate-gradient {
		background-size: 200% auto;
		animation: gradient 8s linear infinite;
	}
</style> 