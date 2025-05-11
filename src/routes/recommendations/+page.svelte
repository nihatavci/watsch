<script lang="ts">
	import { Film, Tv, Sparkles, Brain, Zap, Search, Star, Clock, ThumbsUp, X } from 'lucide-svelte';
	import Form from '$lib/Form.svelte';
	import RecommendationCard from '$lib/RecommendationCard.svelte';
	import { library } from '../../stores/library';
	import { fade, slide, fly } from 'svelte/transition';
	import { backOut, elasticOut } from 'svelte/easing';
	import { i18nStore } from '$lib/i18n';
	import { onMount } from 'svelte';

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
	let mounted = false;

	onMount(() => {
		mounted = true;
	});

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
					searched:
						cinemaType +
						(selectedGenres.length > 0 ? `, ${selectedGenres.join(', ')}` : '') +
						(selectedPlatforms.length > 0 ? ` on ${selectedPlatforms.join(', ')}` : ''),
					preferences: preferences || '' // Pass the user preferences to the API
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

			recommendations = data.map((item) => ({
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

		// Trim preferences and ensure it's properly formatted
		preferences = preferences.trim();

		// Add context to the preferences if empty to encourage sharing specific preferences
		if (preferences.length === 0) {
			// We don't add default preferences, just ensure it's an empty string
			preferences = '';
		}

		getRecommendations();
	}

	function toggleForm() {
		isFormCollapsed = !isFormCollapsed;
	}

	// Generate random animation delays for staggered animations
	const getRandomDelay = (min = 0, max = 300) => Math.random() * (max - min) + min;
</script>

<svelte:head>
	<title>Discover Movies & Shows | Watsch</title>
	<meta
		name="description"
		content="Get personalized AI-powered recommendations for your next favorite movie or TV show with Watsch."
	/>
</svelte:head>

<div class="relative min-h-screen pt-16 pb-24 overflow-hidden bg-white dark:bg-black">
	<!-- Remove gradient circles and use a clean black background -->

	<!-- Content -->
	<div class="relative z-20 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
		{#if mounted}
			<div class="space-y-3 sm:space-y-4" in:fly={{ y: -20, duration: 800, easing: backOut }}>
				<div class="flex items-center gap-2 text-red-500">
					<Sparkles class="w-4 h-4 sm:w-5 sm:h-5" />
					<span class="text-xs sm:text-sm font-medium uppercase tracking-wider"
						>AI-POWERED RECOMMENDATIONS</span
					>
				</div>
				<h1 class="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white">
					Discover Your Next <span class="text-red-500">Favorite</span>
				</h1>
				<p class="text-base sm:text-lg text-gray-600 dark:text-gray-400 py-3 sm:py-5 max-w-2xl">
					Our AI understands your taste and finds the perfect movies and shows tailored just for
					you.
				</p>
			</div>
		{/if}

		<div class="relative mt-6 sm:mt-8">
			{#if recommendations.length > 0}
				<button
					on:click={toggleForm}
					class="mb-4 sm:mb-6 px-4 sm:px-5 py-2.5 rounded-lg bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-950 transition-all duration-300 flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start"
				>
					<span>{isFormCollapsed ? 'Show Filters' : 'Hide Filters'}</span>
					<svg
						class="w-4 h-4 transform transition-transform duration-300 {isFormCollapsed
							? ''
							: 'rotate-180'}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</button>
			{/if}

			{#if !isFormCollapsed || recommendations.length === 0}
				<div transition:slide={{ duration: 400 }} class="mb-8">
					<div
						class="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl p-5 sm:p-6 shadow-xl"
					>
						<form class="space-y-5 sm:space-y-7" on:submit|preventDefault={handleSubmit}>
							<!-- Cinema Type -->
							<div class="space-y-2">
								<label
									class="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300"
								>
									What are you looking for?
								</label>
								<div class="grid grid-cols-2 gap-3 sm:gap-4">
									<button
										type="button"
										class="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl border-2 transition-all duration-300 shadow-sm {cinemaType ===
										'movie'
											? 'border-red-500 bg-red-500/10 scale-[1.02]'
											: 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 bg-white dark:bg-black'}"
										on:click={() => (cinemaType = 'movie')}
									>
										<div
											class="flex items-center justify-center w-10 h-10 rounded-full {cinemaType ===
											'movie'
												? 'bg-red-500/20 text-red-500'
												: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}"
										>
											<Film class="w-5 h-5" />
										</div>
										<span
											class="text-base sm:text-lg font-medium {cinemaType === 'movie'
												? 'text-red-500'
												: 'text-gray-700 dark:text-gray-300'}">Movie</span
										>
									</button>
									<button
										type="button"
										class="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl border-2 transition-all duration-300 shadow-sm {cinemaType ===
										'tv'
											? 'border-red-500 bg-red-500/10 scale-[1.02]'
											: 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 bg-white dark:bg-black'}"
										on:click={() => (cinemaType = 'tv')}
									>
										<div
											class="flex items-center justify-center w-10 h-10 rounded-full {cinemaType ===
											'tv'
												? 'bg-red-500/20 text-red-500'
												: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}"
										>
											<Tv class="w-5 h-5" />
										</div>
										<span
											class="text-base sm:text-lg font-medium {cinemaType === 'tv'
												? 'text-red-500'
												: 'text-gray-700 dark:text-gray-300'}">TV Show</span
										>
									</button>
								</div>
							</div>

							<!-- Genres -->
							<div class="space-y-2">
								<label
									class="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
								>
									<ThumbsUp class="w-4 h-4" />
									Choose genres (optional)
								</label>
								<div class="flex flex-wrap gap-2 sm:gap-3">
									{#each genres as genre, i}
										{#if mounted}
											<button
												type="button"
												in:fly={{
													y: 20,
													delay: getRandomDelay(),
													duration: 400,
													easing: elasticOut
												}}
												class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border-2 text-sm transition-all duration-300 shadow-sm {selectedGenres.includes(
													genre
												)
													? 'border-red-500 bg-red-500/10 text-red-500 scale-[1.05]'
													: 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600 bg-white dark:bg-black hover:scale-[1.03]'}"
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
										{/if}
									{/each}
								</div>
							</div>

							<!-- Platforms -->
							<div class="space-y-2">
								<label
									class="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
								>
									<Star class="w-4 h-4" />
									Available on (optional)
								</label>
								<div class="flex flex-wrap gap-2 sm:gap-3">
									{#each platforms as platform, i}
										{#if mounted}
											<button
												type="button"
												in:fly={{
													y: 20,
													delay: getRandomDelay(),
													duration: 400,
													easing: elasticOut
												}}
												class="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border-2 text-sm transition-all duration-300 shadow-sm {selectedPlatforms.includes(
													platform
												)
													? 'border-red-500 bg-red-500/10 text-red-500 scale-[1.05]'
													: 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600 bg-white dark:bg-black hover:scale-[1.03]'}"
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
										{/if}
									{/each}
								</div>
							</div>

							<!-- Preferences -->
							<div class="space-y-2">
								<label
									class="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
								>
									<Brain class="w-4 h-4 text-red-500" />
									<span class="flex items-center gap-1.5">
										AI-Enhanced Preferences
										<span
											class="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
										>
											SMART
										</span>
									</span>
								</label>
								<div class="relative">
									<input
										type="text"
										bind:value={preferences}
										placeholder="e.g., 'with strong female lead', 'from 1990s', '8+ rating'"
										class="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-colors text-sm"
									/>
									<div class="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-start gap-2">
										<Sparkles class="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
										<span
											>Our AI will analyze your preferences to enhance your recommendations. Try
											phrases like "with Tom Hanks", "feel-good comedies", or "mind-bending plots".</span
										>
									</div>
								</div>
							</div>

							<!-- Submit -->
							<button
								type="submit"
								class="w-full py-3 sm:py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-base transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2"
								disabled={!cinemaType || loading}
							>
								{#if loading}
									<div
										class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
									/>
									<span>AI Analysis in Progress...</span>
								{:else}
									<Brain class="w-5 h-5" />
									<span>Get Smart Recommendations</span>
								{/if}
							</button>
						</form>
					</div>
				</div>
			{/if}
		</div>

		{#if recommendations.length === 0}
			<div in:fade={{ duration: 300 }}>
				{#if error}
					<div
						class="mt-4 p-5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-base flex items-start gap-3"
					>
						<div class="flex-shrink-0 p-2 bg-red-500/20 rounded-full">
							<X class="w-5 h-5" />
						</div>
						<div>
							<p class="font-medium">Error</p>
							<p>{error}</p>
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<div class="mt-8 space-y-5 sm:space-y-6" in:fade={{ duration: 400, delay: 200 }}>
				{#each recommendations as recommendation, i}
					<div in:fade={{ duration: 400, delay: 300 + i * 100 }}>
						<RecommendationCard
							{recommendation}
							{selectedPlatforms}
							on:dismiss={() => dismissRecommendation(i)}
						/>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	/* Let the theme system handle the background color */
	:global(body) {
		@apply transition-colors duration-300;
	}
</style>
