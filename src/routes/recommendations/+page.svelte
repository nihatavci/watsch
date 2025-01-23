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
		loading = true;
		error = null;
		recommendations = [];

		try {
			let searchCriteria = `Give me a list of 5 ${cinemaType}s`;
			if (selectedGenres.length > 0) {
				searchCriteria += ` in these genres: ${selectedGenres.join(', ')}`;
			}
			if (selectedPlatforms.length > 0) {
				searchCriteria += ` available on ${selectedPlatforms.join(' or ')}`;
			}
			if (preferences) {
				searchCriteria += `. Additional preferences: ${preferences}`;
			}
			searchCriteria += `. Format the response as a numbered list. Each item should start with a number followed by a dot, then the title, then a colon, then a brief description.`;

			console.log('Search Criteria:', searchCriteria);

			const response = await fetch('/api/getRecommendation', {
				method: 'POST',
				body: JSON.stringify({
					searched: searchCriteria
				}),
				headers: {
					'content-type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const text = await response.text();
			console.log('Raw API Response:', text);

			const lines = text
				.split('\n')
				.filter(line => line.trim())
				.filter(line => /^\d+\./.test(line));
			
			console.log('Filtered Lines:', lines);

			const processedRecommendations = lines
				.map(line => {
					const match = line.match(/^\d+\.\s*([^:]+):\s*(.+)$/);
					console.log('Processing line:', line, 'Match:', match);
					if (!match) return null;
					const [, title, description] = match;
					return {
						title: title.trim(),
						description: description.trim(),
						type: cinemaType as 'movie' | 'tv'
					};
				})
				.filter((rec): rec is Recommendation => 
					rec !== null && 
					typeof rec === 'object' &&
					typeof rec.title === 'string' &&
					typeof rec.description === 'string' &&
					(rec.type === 'movie' || rec.type === 'tv')
				);

			console.log('Processed Recommendations:', processedRecommendations);

			if (processedRecommendations.length === 0) {
				throw new Error('No valid recommendations found in the response');
			}

			recommendations = processedRecommendations;
			isFormCollapsed = true;

			// Add to history if successful
			if ('addToHistory' in library) {
				(library as any).addToHistory(searchCriteria);
			}

		} catch (err) {
			console.error('Detailed Error:', {
				name: err instanceof Error ? err.name : 'Unknown',
				message: err instanceof Error ? err.message : String(err),
				stack: err instanceof Error ? err.stack : undefined
			});
			error = err instanceof Error ? err.message : 'Failed to get recommendations';
			recommendations = [];
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

<div class="relative min-h-screen bg-[#0A0118]">
	<!-- Gradient background -->
	<div class="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(220,38,38,0.15),rgba(255,255,255,0))]" />

	<!-- RetroGrid -->
	<div class="pointer-events-none fixed inset-0 overflow-hidden [perspective:200px]">
		<div class="absolute inset-0 [transform:rotateX(65deg)]">
			<div class="animate-grid [background-image:linear-gradient(to_right,rgba(220,38,38,0.1)_1px,transparent_0),linear-gradient(to_bottom,rgba(220,38,38,0.1)_1px,transparent_0)] [background-repeat:repeat] [background-size:50px_50px] [height:300vh] [inset:0%_0px] [margin-left:-200%] [transform-origin:100%_0_0] [width:600vw]" />
		</div>
		<div class="absolute inset-0 bg-gradient-to-t from-[#0A0118] to-transparent to-90%" />
	</div>

	<!-- Content -->
	<div class="relative z-10 max-w-4xl mx-auto px-4 py-6">
		<div class="space-y-3">
			<div class="flex items-center gap-2 text-red-500">
				<Sparkles class="w-5 h-5" />
				<span class="text-sm font-medium">AI-Powered Recommendations</span>
			</div>
			<h1 class="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-white to-red-500 animate-gradient">
				Discover Your Next Favorite
			</h1>
			<p class="text-lg text-white/60 py-5 max-w-2xl">
				Our AI understands your taste and finds the perfect movies for you.
			</p>
		</div>

		
		<div class="relative">
			{#if recommendations.length > 0}
				<button
					on:click={toggleForm}
					class="mb-4 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-2"
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
					<form class="space-y-6" on:submit|preventDefault={handleSubmit}>
						<!-- Cinema Type -->
						<div class="grid grid-cols-2 gap-4">
							<button
								type="button"
								class="flex items-center gap-3 p-4 rounded-xl border-2 transition-all {cinemaType === 'movie' ? 'border-red-500 bg-red-500/5' : 'border-red-500/20 hover:border-red-500/40 bg-black/40'}"
								on:click={() => (cinemaType = 'movie')}
							>
								<Film class="w-5 h-5 {cinemaType === 'movie' ? 'text-red-500' : 'text-white/60'}" />
								<span class="text-base font-medium {cinemaType === 'movie' ? 'text-red-500' : 'text-white/60'}">Movie</span>
							</button>
							<button
								type="button"
								class="flex items-center gap-3 p-4 rounded-xl border-2 transition-all {cinemaType === 'tv' ? 'border-red-500 bg-red-500/5' : 'border-red-500/20 hover:border-red-500/40 bg-black/40'}"
								on:click={() => (cinemaType = 'tv')}
							>
								<Tv class="w-5 h-5 {cinemaType === 'tv' ? 'text-red-500' : 'text-white/60'}" />
								<span class="text-base font-medium {cinemaType === 'tv' ? 'text-red-500' : 'text-white/60'}">TV Show</span>
							</button>
						</div>

						<!-- Genres -->
						<div class="space-y-2">
							<label class="block text-base font-medium text-white">Choose genres (optional)</label>
							<div class="flex flex-wrap gap-2">
								{#each genres as genre}
									<button
										type="button"
										class="px-3 py-1.5 rounded-lg border-2 text-sm transition-all {selectedGenres.includes(genre) ? 'border-red-500 bg-red-500/5 text-red-500' : 'border-red-500/20 text-white/60 hover:border-red-500/40 bg-black/40'}"
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
							<label class="block text-base font-medium text-white">Available on (optional)</label>
							<div class="flex flex-wrap gap-2">
								{#each platforms as platform}
									<button
										type="button"
										class="px-3 py-1.5 rounded-lg border-2 text-sm transition-all {selectedPlatforms.includes(platform) ? 'border-red-500 bg-red-500/5 text-red-500' : 'border-red-500/20 text-white/60 hover:border-red-500/40 bg-black/40'}"
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
							<label class="block text-base font-medium text-white">Any specific preferences? (optional)</label>
							<input
								type="text"
								bind:value={preferences}
								placeholder="e.g., 'with strong female lead', 'released after 2010'"
								class="w-full px-4 py-2 rounded-lg border-2 border-red-500/20 bg-black/40 text-white placeholder-white/40 focus:outline-none focus:border-red-500/40 transition-colors text-sm"
							/>
						</div>

						<!-- Submit -->
						<button
							type="submit"
							class="w-full py-3 rounded-lg bg-gradient-to-r from-red-500 via-red-500 to-red-600 hover:shadow-xl hover:shadow-red-500/20 text-white font-medium text-base transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2"
							disabled={!cinemaType || loading}
						>
							{#if loading}
								<div class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
								<span>Finding the Perfect Match...</span>
							{:else}
								<Sparkles class="w-4 h-4" />
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
					<div class="mt-4 p-4 rounded-xl bg-red-500/10 text-red-400">
						{error}
					</div>
				{/if}
			</div>
		{:else}
			<div class="mt-8 space-y-4">
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