<script lang="ts">
	import { Film, Tv, Sparkles, Brain, Zap, Search, Star, Clock, ThumbsUp, X } from 'lucide-svelte';
	import RecommendationCard from '$lib/RecommendationCard.svelte';
	import { library } from '../../stores/library';
	import { fade, slide, fly } from 'svelte/transition';
	import { backOut, elasticOut } from 'svelte/easing';
	import { i18nStore } from '$lib/i18n';
	import { onMount, onDestroy } from 'svelte';
	import SearchLimitIndicator from '$lib/components/ui/SearchLimitIndicator.svelte';
	import SearchLimitModal from '$lib/components/ui/SearchLimitModal.svelte';
	import { authStore } from '$lib/stores/auth';
	import { recommendationsStore, type Recommendation } from '../../stores/recommendations';

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

<div class="min-h-screen bg-background">
	<!-- Search Limit Indicator -->
	<SearchLimitIndicator />

	<!-- Main Container -->
	<div class="pt-4 pb-4">
		<div class="max-w-4xl mx-auto">
			<!-- Header -->
			<div class="mb-4">
				<div class="flex items-center gap-2 text-destructive mb-2">
					<Sparkles class="w-4 h-4" />
					<span class="text-xs font-medium uppercase tracking-wider">AI Powered</span>
				</div>
				<h1 class="text-2xl sm:text-3xl font-bold text-foreground mb-1">
					{$i18nStore.t('recommendations.title', 'Get Recommendations')}
				</h1>
				<p class="text-sm text-muted-foreground">
					{$i18nStore.t('recommendations.subtitle', 'Discover your next favorite movie or TV show')}
				</p>
			</div>

			<!-- Recommendation Form -->
			<div class="mb-6" class:mb-4={recommendations.length > 0}>
				<!-- Form Controls (show when recommendations exist) -->
				{#if recommendations.length > 0}
					<div class="flex flex-col sm:flex-row gap-2 mb-3">
						<button
							on:click={() => isFormCollapsed = !isFormCollapsed}
							class="btn-secondary btn-sm gap-2 flex-1"
						>
							<Search class="w-4 h-4" />
							<span>{isFormCollapsed ? 'Show Filters' : 'Hide Filters'}</span>
						</button>
						<button
							on:click={() => {
								recommendations = [];
								error = null;
								isFormCollapsed = false;
							}}
							class="btn-destructive btn-sm gap-2 flex-1"
						>
							<Zap class="w-4 h-4" />
							<span>New Search</span>
						</button>
					</div>
				{/if}

				<div
					class="card-base p-4 transition-all duration-300"
					class:shadow-[2px_2px_0px_0px_hsl(var(--border))]={isFormCollapsed}
					class:shadow-[4px_4px_0px_0px_hsl(var(--border))]={!isFormCollapsed}
				>
					{#if !isFormCollapsed}
						<form on:submit|preventDefault={handleSubmit} class="space-y-4">
							<!-- Media Type Selection -->
							<div class="space-y-2">
								<label class="block text-sm font-medium text-foreground flex items-center gap-2">
									<Film class="w-4 h-4" />
									{$i18nStore.t('form.what_looking_for', 'What are you looking for?')}
								</label>
								<div class="grid grid-cols-2 gap-3">
									<button
										type="button"
										class="btn-base p-3 transition-all duration-100 {cinemaType === 'movie'
											? 'border-destructive bg-destructive/10 text-destructive scale-[1.02]'
											: 'border-border text-foreground bg-card'}"
										on:click={() => (cinemaType = 'movie')}
									>
										<div class="flex items-center gap-2">
											<div
												class="p-1.5 border border-current {cinemaType === 'movie'
													? 'bg-destructive text-destructive-foreground'
													: 'bg-secondary text-secondary-foreground'}"
											>
												<Film class="w-4 h-4" />
											</div>
											<span class="text-sm font-medium">{$i18nStore.t('form.movie', 'Movie')}</span>
										</div>
									</button>
									<button
										type="button"
										class="btn-base p-3 transition-all duration-100 {cinemaType === 'tv'
											? 'border-destructive bg-destructive/10 text-destructive scale-[1.02]'
											: 'border-border text-foreground bg-card'}"
										on:click={() => (cinemaType = 'tv')}
									>
										<div class="flex items-center gap-2">
											<div
												class="p-1.5 border border-current {cinemaType === 'tv'
													? 'bg-destructive text-destructive-foreground'
													: 'bg-secondary text-secondary-foreground'}"
											>
												<Tv class="w-4 h-4" />
											</div>
											<span class="text-sm font-medium">{$i18nStore.t('form.tv_show', 'TV Show')}</span>
										</div>
									</button>
								</div>
							</div>

							<!-- Genres -->
							<div class="space-y-2">
								<label class="block text-sm font-medium text-foreground flex items-center gap-2">
									<ThumbsUp class="w-4 h-4" />
									{$i18nStore.t('form.choose_genres', 'Genres (optional)')}
								</label>
								<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
									{#each genres as genre, i}
										{#if mounted}
											<button
												type="button"
												in:fly={{
													y: 10,
													delay: i * 20,
													duration: 200
												}}
												class="btn-base text-xs py-2 px-2 transition-all duration-100 {selectedGenres.includes(
													genre
												)
													? 'border-destructive bg-destructive/10 text-destructive scale-[1.02]'
													: 'border-border text-foreground bg-card'}"
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
								<label class="block text-sm font-medium text-foreground flex items-center gap-2">
									<Star class="w-4 h-4" />
									{$i18nStore.t('form.available_on', 'Platforms (optional)')}
								</label>
								<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
									{#each platforms as platform, i}
										{#if mounted}
											<button
												type="button"
												in:fly={{
													y: 10,
													delay: i * 20,
													duration: 200
												}}
												class="btn-base text-xs py-2 px-2 transition-all duration-100 {selectedPlatforms.includes(
													platform
												)
													? 'border-destructive bg-destructive/10 text-destructive scale-[1.02]'
													: 'border-border text-foreground bg-card'}"
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

							<!-- Compact Rating Filter -->
							<div class="space-y-3">
								<label class="block text-sm font-medium text-foreground flex items-center gap-2">
									<Star class="w-4 h-4 text-yellow-500" />
									{$i18nStore.t('form.minimum_rating', 'Min Rating (optional)')}
								</label>
								
								<div class="flex items-center gap-3">
									<!-- Current value display -->
									{#if minRating > 0}
										<div class="flex items-center gap-2 px-3 py-1.5 bg-card border border-border text-sm">
											<div class="flex items-center gap-0.5">
												{#each Array(5) as _, i}
													<Star 
														class="w-3 h-3 {i < Math.ceil(minRating/2) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}" 
													/>
												{/each}
											</div>
											<span class="font-medium text-foreground">{minRating}/10</span>
										</div>
									{/if}
									
									<!-- Quick buttons -->
									<div class="flex gap-1">
										{#each [0, 6, 7, 8, 9] as rating}
											<button
												type="button"
												on:click={() => minRating = rating}
												class="px-2 py-1 text-xs font-medium bg-card border border-border hover:shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-100 {minRating === rating ? 'bg-primary text-primary-foreground' : 'text-foreground'}"
											>
												{rating === 0 ? 'Any' : rating}
											</button>
										{/each}
									</div>
								</div>
							</div>

							<!-- Preferences -->
							<div class="space-y-2">
								<label class="block text-sm font-medium text-foreground flex items-center gap-2">
									<Brain class="w-4 h-4 text-destructive" />
									<span class="flex items-center gap-1.5">
										{$i18nStore.t('form.ai_preferences', 'AI Preferences')}
										<span class="inline-flex items-center px-1.5 py-0.5 text-xs font-bold bg-destructive/10 text-destructive border border-destructive/30">
											SMART
										</span>
									</span>
								</label>
								<div class="space-y-2">
									<input
										type="text"
										bind:value={preferences}
										placeholder={$i18nStore.t('form.preferences_placeholder', "e.g., 'strong female lead', '1990s', '8+ rating'")}
										class="input-base w-full px-3 py-2 text-sm"
									/>
									<div class="text-xs text-muted-foreground flex items-start gap-1.5">
										<Sparkles class="w-3 h-3 text-destructive flex-shrink-0 mt-0.5" />
										<span>Try: "with Tom Hanks", "feel-good comedies", or "mind-bending plots"</span>
									</div>
								</div>
							</div>

							<!-- Submit -->
							<button
								type="submit"
								class="btn-destructive btn-md w-full gap-2 font-bold"
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
					{/if}
				</div>
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
</div>

<!-- Search Limit Modal -->
<SearchLimitModal open={showLimitModal} onClose={closeLimitModal} />

<style lang="postcss">
	/* Let the theme system handle the background color */
	:global(body) {
		@apply transition-colors duration-300;
	}

	/* Neobrutalism rating slider styling */
	.rating-slider::-webkit-slider-thumb {
		appearance: none;
		height: 24px;
		width: 24px;
		border-radius: 5px;
		background: hsl(var(--primary));
		cursor: pointer;
		border: 2px solid hsl(var(--border));
		box-shadow: 4px 4px 0px 0px hsl(var(--border));
		transition: all 0.1s ease;
	}

	.rating-slider::-moz-range-thumb {
		height: 24px;
		width: 24px;
		border-radius: 5px;
		background: hsl(var(--primary));
		cursor: pointer;
		border: 2px solid hsl(var(--border));
		box-shadow: 4px 4px 0px 0px hsl(var(--border));
		transition: all 0.1s ease;
	}

	.rating-slider:hover::-webkit-slider-thumb {
		transform: translate(-2px, -2px);
		box-shadow: 6px 6px 0px 0px hsl(var(--border));
	}

	.rating-slider:hover::-moz-range-thumb {
		transform: translate(-2px, -2px);
		box-shadow: 6px 6px 0px 0px hsl(var(--border));
	}

	.rating-slider:active::-webkit-slider-thumb {
		transform: translate(2px, 2px);
		box-shadow: 2px 2px 0px 0px hsl(var(--border));
	}

	.rating-slider:active::-moz-range-thumb {
		transform: translate(2px, 2px);
		box-shadow: 2px 2px 0px 0px hsl(var(--border));
	}

	.rating-slider::-webkit-slider-track {
		height: 16px;
		border-radius: 5px;
		background: hsl(var(--muted));
		border: none;
	}

	.rating-slider::-moz-range-track {
		height: 16px;
		border-radius: 5px;
		background: hsl(var(--muted));
		border: none;
	}
</style>
