<script lang="ts">
	import { Film, Tv, Sparkles, Brain, Zap, Search, Star, Clock, ThumbsUp, X } from 'lucide-svelte';
	import Form from '$lib/Form.svelte';
	import RecommendationCard from '$lib/RecommendationCard.svelte';
	import { library } from '../../stores/library';
	import { fade, slide, fly } from 'svelte/transition';
	import { backOut, elasticOut } from 'svelte/easing';
	import { i18nStore } from '$lib/i18n';
	import { onMount, onDestroy } from 'svelte';
	import SearchLimitIndicator from '$lib/components/ui/SearchLimitIndicator.svelte';
	import SearchLimitModal from '$lib/components/ui/SearchLimitModal.svelte';
	import { authStore } from '$lib/stores/auth';
	import { recommendationsStore } from '../../stores/recommendations';

	interface Recommendation {
		title: string;
		description: string;
		type: 'movie' | 'tv';
		id: number;
		year: number | null;
		rating: number;
		poster_path: string | null;
		backdrop_path: string | null;
		popularity: number;
		genre_ids: number[];
		original_language: string;
	}

	let cinemaType: 'movie' | 'tv' | null = null;
	let selectedGenres: string[] = [];
	let selectedPlatforms: string[] = [];
	let minRating: number = 0;
	let preferences = '';
	let loading = false;
	let recommendations: Recommendation[] = [];
	let error: string | null = null;
	let isFormCollapsed = false;
	let mounted = false;
	let showLimitModal = false;
	let unsubscribeRecommendations: () => void;

	onMount(() => {
		mounted = true;
		unsubscribeRecommendations = recommendationsStore.subscribe((val) => {
			recommendations = val;
		});
	});

	// Unsubscribe on destroy
	onDestroy(() => {
		if (unsubscribeRecommendations) unsubscribeRecommendations();
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

	async function getRecommendations(query: string) {
		console.log('[Client Debug] ====== Starting Recommendation Request ======');
		const startTime = Date.now();

		try {
			// Get current auth state
			let token: string | null = null;
			let isAuthenticated = false;
			
			const unsubscribe = authStore.subscribe(($auth) => {
				token = $auth.token;
				isAuthenticated = $auth.isAuthenticated;
				console.log('[Auth Debug] Auth state:', {
					isAuthenticated: $auth.isAuthenticated,
					hasToken: !!$auth.token,
					tokenExpiry: $auth.tokenExpiry ? new Date($auth.tokenExpiry).toISOString() : null,
					user: $auth.user ? { 
						email: $auth.user.email,
						userId: $auth.user.userId
					} : null
				});
			});
			unsubscribe();

			if (!query || query.trim().length === 0) {
				console.warn('[Validation Debug] Empty query detected');
				throw new Error('Please enter some preferences or select genres');
			}

			console.log('[Request Debug] Preparing request:', {
				query,
				mediaType: cinemaType || 'movie',
				genres: selectedGenres,
				platforms: selectedPlatforms,
				minRating: minRating > 0 ? minRating : undefined,
				isAuthenticated,
				hasToken: !!token
			});

			const headers: Record<string, string> = {
				'Content-Type': 'application/json',
				'Cache-Control': 'no-cache, no-store, must-revalidate',
				'Pragma': 'no-cache',
				'Expires': '0'
			};

			if (token) {
				headers['Authorization'] = `Bearer ${token}`;
				console.log('[Auth Debug] Added authorization header');
			} else {
				console.log('[Auth Debug] No token available for request');
			}

			console.log('[Request Debug] Sending request with headers:', headers);

			// Add cache busting parameter
			const timestamp = Date.now();
			const response = await fetch(`/api/getRecommendation?t=${timestamp}`, {
				method: 'POST',
				headers,
				body: JSON.stringify({
					query,
					mediaType: cinemaType || 'movie',
					genres: selectedGenres,
					platforms: selectedPlatforms,
					minRating: minRating > 0 ? minRating : undefined,
					timestamp
				})
			});

			console.log('[Response Debug] Status:', response.status);
			console.log('[Response Debug] Headers:', Object.fromEntries(response.headers.entries()));

			const data = await response.json();
			console.log('[Response Debug] Response data:', data);

			if (!response.ok) {
				if (response.status === 429) {
					console.warn('[Error Debug] Search limit reached:', {
						isAuthenticated,
						data
					});
					showLimitModal = true;
					throw new Error(data.message || 'Search limit reached');
				}
				console.error('[Error Debug] Request failed:', {
					status: response.status,
					data
				});
				throw new Error(data.error || 'Failed to get recommendations');
			}

			// Handle wrapped API response structure with more robust parsing
			console.log('[Response Debug] Raw data structure:', JSON.stringify(data, null, 2));
			
			let actualResults = [];
			
			// Try multiple parsing approaches
			if (data.data?.data?.results) {
				actualResults = data.data.data.results;
				console.log('[Response Debug] Using data.data.data.results');
			} else if (data.data?.results) {
				actualResults = data.data.results;
				console.log('[Response Debug] Using data.data.results');
			} else if (data.results) {
				actualResults = data.results;
				console.log('[Response Debug] Using data.results');
			} else if (Array.isArray(data)) {
				actualResults = data;
				console.log('[Response Debug] Using data as array');
			}
			
			console.log('[Response Debug] Parsed results:', actualResults?.length || 0, 'items');
			
			if (!actualResults || actualResults.length === 0) {
				console.warn('[Response Debug] No recommendations found');
				console.warn('[Response Debug] Full response structure:', data);
				throw new Error('No recommendations found matching your criteria. Try broadening your search.');
			}

			const duration = Date.now() - startTime;
			console.log(`[Performance Debug] Request completed in ${duration}ms`);
			console.log('[Response Debug] Found recommendations:', actualResults.length);

			if (duration < 3000) {
				await delay(3000 - duration);
			}

			return actualResults;
		} catch (error) {
			console.error('[Error Debug] ====== Error Details ======');
			console.error('[Error Debug] Error:', error);
			console.error('[Error Debug] Stack:', error instanceof Error ? error.stack : 'No stack available');
			console.error('[Error Debug] Request duration:', Date.now() - startTime, 'ms');

			if (error instanceof Error) {
				throw error;
			}
			throw new Error('Failed to get recommendations');
		}
	}

	function dismissRecommendation(index: number) {
		recommendations = recommendations.filter((_, i) => i !== index);
	}

	async function handleSubmit() {
		console.log('[Form Debug] ====== Form Submission Started ======');
		const startTime = Date.now();

		if (!cinemaType) {
			console.warn('[Validation Debug] No cinema type selected');
			error = 'Please select a type (Movie or TV Show)';
			return;
		}

		try {
			loading = true;
			error = null;
			recommendations = [];

			console.log('[Form Debug] Form state:', {
				cinemaType,
				selectedGenres,
				selectedPlatforms,
				minRating,
				preferences: preferences.trim()
			});

			// Trim preferences and ensure it's properly formatted
			preferences = preferences.trim();

			// Get recommendations
			const results = await getRecommendations(preferences || 'any');
			
			console.log('[Response Debug] Processing results:', results.length);

			// Update recommendations with the correct type
			recommendations = results.map((item: Recommendation) => ({
				...item,
				type: cinemaType
			}));

			console.log('[UI Debug] Updated recommendations:', recommendations.length);

			// Check if no recommendations were found
			if (recommendations.length === 0) {
				error = $i18nStore.t('recommendations.error.no_results', 'No recommendations found matching your criteria. Try broadening your search.');
			} else {
				// Collapse form after successful search
				isFormCollapsed = true;
			}

			const duration = Date.now() - startTime;
			console.log(`[Performance Debug] Form submission completed in ${duration}ms`);

			recommendationsStore.set(recommendations);
		} catch (err) {
			console.error('[Error Debug] Form submission error:', err);
			error = $i18nStore.t('recommendations.error.general', 'Failed to get recommendations. Please try again.');
			recommendations = [];
		} finally {
			loading = false;
			console.log('[Form Debug] Form submission completed');
		}
	}

	function toggleForm() {
		isFormCollapsed = !isFormCollapsed;
	}

	function closeLimitModal() {
		showLimitModal = false;
	}

	// Generate random animation delays for staggered animations
	const getRandomDelay = (min = 0, max = 300) => Math.random() * (max - min) + min;

	function delay(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	function resetSearch() {
		recommendations = [];
		recommendationsStore.set([]);
		error = null;
		preferences = '';
		isFormCollapsed = false;
	}
</script>

<svelte:head>
	<title>Discover Movies & Shows | Watsch</title>
	<meta
		name="description"
		content="Get personalized AI-powered recommendations for your next favorite movie or TV show with Watsch."
	/>
</svelte:head>

<div class="relative min-h-screen pt-16 pb-24 overflow-hidden">
	<!-- Content -->
	<div class="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
		{#if mounted}
			<div class="space-y-3 sm:space-y-4" in:fly={{ y: -20, duration: 800, easing: backOut }}>
				<div class="flex items-center gap-2 text-red-500">
					<Sparkles class="w-4 h-4 sm:w-5 sm:h-5" />
					<span class="text-xs sm:text-sm font-medium uppercase tracking-wider">
						{$i18nStore.t('home.ai_powered', 'AI-POWERED RECOMMENDATIONS')}
					</span>
				</div>
				<h1 class="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white">
					{@html $i18nStore.t('home.headline')}
				</h1>
				<p class="text-base sm:text-lg text-gray-600 dark:text-gray-400 py-3 sm:py-5 max-w-2xl">
					{$i18nStore.t('home.description', 'Our AI understands your taste and finds the perfect movies and shows tailored just for you.')}
				</p>
			</div>
		{/if}

		<div class="relative mt-6 sm:mt-8">
			<!-- Search Limit Indicator -->
			<SearchLimitIndicator />
			
			{#if recommendations.length > 0}
				<div class="flex gap-2 mb-4 sm:mb-6">
					<button
						on:click={toggleForm}
						class="px-4 sm:px-5 py-2.5 rounded-lg bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-950 transition-all duration-300 flex items-center gap-2 text-sm sm:text-base"
					>
						<span>{isFormCollapsed ? $i18nStore.t('recommendations.show_filters', 'Show Filters') : $i18nStore.t('recommendations.hide_filters', 'Hide Filters')}</span>
					</button>
					<button
						on:click={resetSearch}
						class="px-4 sm:px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-sm sm:text-base transition-all duration-300 flex items-center gap-2"
					>
						<span>{$i18nStore.t('recommendations.find_another', 'Find Another')}</span>
					</button>
				</div>
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
									{$i18nStore.t('form.what_looking_for', 'What are you looking for?')}
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
												: 'text-gray-700 dark:text-gray-300'}">{$i18nStore.t('form.movie', 'Movie')}</span
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
												: 'text-gray-700 dark:text-gray-300'}">{$i18nStore.t('form.tv_show', 'TV Show')}</span
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
									{$i18nStore.t('form.choose_genres', 'Choose genres (optional)')}
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
												{$i18nStore.t('genres.' + genre.toLowerCase().replace(/[^a-z0-9]/g, '_'), genre)}
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
									{$i18nStore.t('form.available_on', 'Available on (optional)')}
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
												{$i18nStore.t('platforms.' + platform.toLowerCase().replace(/[^a-z0-9]/g, '_'), platform)}
											</button>
										{/if}
									{/each}
								</div>
							</div>

							<!-- Rating Filter -->
							<div class="space-y-4">
								<label
									class="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
								>
									<Star class="w-4 h-4 text-yellow-500" />
									{$i18nStore.t('form.minimum_rating', 'Minimum Rating (optional)')}
								</label>
								
								<!-- Clean Rating Slider -->
								<div class="space-y-4">
									<!-- Current value display -->
									{#if minRating > 0}
										<div class="flex items-center justify-center">
											<div class="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-full">
												<div class="flex items-center">
													{#each Array(5) as _, i}
														<svg 
															class="w-4 h-4 {i < Math.ceil(minRating/2) ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'}" 
															fill="currentColor" 
															viewBox="0 0 20 20"
														>
															<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
														</svg>
													{/each}
												</div>
												<span class="text-sm font-medium text-yellow-700 dark:text-yellow-300">
													{minRating}/10
												</span>
											</div>
										</div>
									{/if}
									
									<!-- Slider container -->
									<div class="relative px-1">
										<input
											type="range"
											min="0"
											max="10"
											step="0.5"
											bind:value={minRating}
											class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer rating-slider"
										/>
										
										<!-- Rating markers -->
										<div class="flex justify-between mt-2 px-1">
											{#each [0, 2, 4, 6, 8, 10] as rating}
												<button
													type="button"
													on:click={() => minRating = rating}
													class="flex flex-col items-center group"
												>
													<div class="w-1 h-3 {minRating >= rating ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-600'} rounded-full transition-colors"></div>
													<span class="text-xs text-gray-500 dark:text-gray-400 mt-1 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
														{rating}
													</span>
												</button>
											{/each}
										</div>
									</div>
									
									<!-- Reset button -->
									{#if minRating > 0}
										<div class="flex justify-center">
											<button
												type="button"
												on:click={() => minRating = 0}
												class="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline transition-colors"
											>
												Clear rating filter
											</button>
										</div>
									{/if}
								</div>
							</div>

							<!-- Preferences -->
							<div class="space-y-2">
								<label
									class="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
								>
									<Brain class="w-4 h-4 text-red-500" />
									<span class="flex items-center gap-1.5">
										{$i18nStore.t('form.ai_preferences', 'AI-Enhanced Preferences')}
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
										placeholder={$i18nStore.t('form.preferences_placeholder', "e.g., 'with strong female lead', 'from 1990s', '8+ rating'")}
										class="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-colors text-sm"
									/>
									<div class="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-start gap-2">
										<Sparkles class="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
										<span>
											{$i18nStore.t('recommendations.ai_hint', 'Our AI will analyze your preferences to enhance your recommendations. Try phrases like "with Tom Hanks", "feel-good comedies", or "mind-bending plots".')}
										</span>
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
									<span>{$i18nStore.t('recommendations.ai_analysis', 'AI Analysis in Progress...')}</span>
								{:else}
									<Brain class="w-5 h-5" />
									<span>{$i18nStore.t('recommendations.get_smart', 'Get Smart Recommendations')}</span>
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

<!-- Search Limit Modal -->
<SearchLimitModal open={showLimitModal} onClose={closeLimitModal} />

<style lang="postcss">
	/* Let the theme system handle the background color */
	:global(body) {
		@apply transition-colors duration-300;
	}

	/* Clean rating slider styling */
	.rating-slider::-webkit-slider-thumb {
		appearance: none;
		height: 20px;
		width: 20px;
		border-radius: 50%;
		background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
		border: 2px solid white;
		transition: all 0.2s ease;
	}

	.rating-slider::-moz-range-thumb {
		height: 20px;
		width: 20px;
		border-radius: 50%;
		background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
		cursor: pointer;
		border: 2px solid white;
		box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
		transition: all 0.2s ease;
	}

	.rating-slider:hover::-webkit-slider-thumb {
		transform: scale(1.1);
		box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
	}

	.rating-slider:hover::-moz-range-thumb {
		transform: scale(1.1);
		box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
	}

	.rating-slider::-webkit-slider-track {
		height: 8px;
		border-radius: 4px;
		background: #e5e7eb;
		transition: background 0.2s ease;
	}

	.rating-slider::-moz-range-track {
		height: 8px;
		border-radius: 4px;
		background: #e5e7eb;
		border: none;
		transition: background 0.2s ease;
	}

	/* Dark mode */
	:global(.dark) .rating-slider::-webkit-slider-thumb {
		border-color: #111827;
	}

	:global(.dark) .rating-slider::-moz-range-thumb {
		border-color: #111827;
	}

	:global(.dark) .rating-slider::-webkit-slider-track {
		background: #374151;
	}

	:global(.dark) .rating-slider::-moz-range-track {
		background: #374151;
	}
</style>
