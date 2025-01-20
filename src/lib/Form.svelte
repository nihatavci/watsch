<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { i18nStore } from './i18n';
	import Button from './ui/button.svelte';
	import { Film, Tv, Search } from 'lucide-svelte';

	export let loading = false;
	export let cinemaType = 'movie';
	export let selectedCategories: string[] = [];
	export let specificDescriptors = '';
	export let selectedPlatforms: string[] = [];

	const dispatch = createEventDispatcher();

	let isSubmitting = false;
	let recommendations: Array<{ title: string; description: string; type: string }> = [];
	let error: string | null = null;

	const categories = [
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

	async function handleSubmit() {
		isSubmitting = true;

		if (selectedCategories.length === 0) {
			selectedCategories = ['Any'];
		}

		// Construct the search criteria
		let prompt = `Give me a list of 5 ${cinemaType} recommendations`;
		if (selectedCategories.length > 0) {
			prompt += ` that fit these categories: ${selectedCategories.join(', ')}`;
		}
		if (selectedPlatforms.length > 0) {
			prompt += ` available on ${selectedPlatforms.join(' or ')}`;
		}
		if (specificDescriptors) {
			prompt += `. Additional preferences: ${specificDescriptors}`;
		}
		prompt += `. Please return this response as a numbered list with the ${cinemaType}'s title, followed by a colon, and then a brief description.`;

		try {
			const response = await fetch('/api/getRecommendation', {
				method: 'POST',
				body: JSON.stringify({
					searched: prompt
				}),
				headers: {
					'content-type': 'application/json'
				}
			});

			if (!response.ok) {
				throw new Error('Failed to get recommendations');
			}

			const data = await response.json();
			dispatch('submit', { recommendations: data.recommendations });
		} catch (error) {
			console.error('Error submitting form:', error);
			error = 'Failed to get recommendations';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<form on:submit|preventDefault={handleSubmit} class="space-y-6">
	<!-- Cinema Type -->
	<div class="space-y-2">
		<fieldset>
			<legend class="block text-sm font-medium text-gray-700 dark:text-white/80">
				What would you like to watch?
			</legend>
			<div class="flex gap-2">
				<button
					type="button"
					class="flex-1 px-4 py-2 rounded-lg {cinemaType === 'movie'
						? 'bg-red-500/10 dark:bg-white/20 text-gray-900 dark:text-white'
						: 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/50'} transition-colors flex items-center justify-center gap-2"
					on:click={() => (cinemaType = 'movie')}
				>
					<Film size={20} />
					Movie
				</button>
				<button
					type="button"
					class="flex-1 px-4 py-2 rounded-lg {cinemaType === 'tv'
						? 'bg-red-500/10 dark:bg-white/20 text-gray-900 dark:text-white'
						: 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/50'} transition-colors flex items-center justify-center gap-2"
					on:click={() => (cinemaType = 'tv')}
				>
					<Tv size={20} />
					TV Show
				</button>
			</div>
		</fieldset>
	</div>

	<!-- Categories -->
	<div class="space-y-2">
		<fieldset>
			<legend class="block text-sm font-medium text-gray-700 dark:text-white/80">
				Choose genres (optional)
			</legend>
			<div class="flex flex-wrap gap-2">
				{#each categories as category}
					<button
						type="button"
						class="px-3 py-1 rounded-full text-sm {selectedCategories.includes(category)
							? 'bg-red-500/10 dark:bg-white/20 text-gray-900 dark:text-white'
							: 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/50'} transition-colors"
						on:click={() => {
							if (selectedCategories.includes(category)) {
								selectedCategories = selectedCategories.filter((c) => c !== category);
							} else {
								selectedCategories = [...selectedCategories, category];
							}
						}}
					>
						{category}
					</button>
				{/each}
			</div>
		</fieldset>
	</div>

	<!-- Platforms -->
	<div class="space-y-2">
		<fieldset>
			<legend class="block text-sm font-medium text-gray-700 dark:text-white/80">
				Available on (optional)
			</legend>
			<div class="flex flex-wrap gap-2">
				{#each platforms as platform}
					<button
						type="button"
						class="px-3 py-1 rounded-full text-sm {selectedPlatforms.includes(platform)
							? 'bg-red-500/10 dark:bg-white/20 text-gray-900 dark:text-white'
							: 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/50'} transition-colors"
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
		</fieldset>
	</div>

	<!-- Additional Preferences -->
	<div class="space-y-2">
		<label for="descriptors" class="block text-sm font-medium text-gray-700 dark:text-white/80">
			Any specific preferences? (optional)
		</label>
		<input
			type="text"
			id="descriptors"
			bind:value={specificDescriptors}
			class="w-full px-4 py-2 rounded-lg bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:focus:ring-white/20"
			placeholder="e.g., 'with strong female lead', 'released after 2010', 'feel-good movies'"
		/>
	</div>

	<Button
		type="submit"
		class="w-full bg-red-500/10 hover:bg-red-500/20 dark:bg-white/10 dark:hover:bg-white/20 text-gray-900 dark:text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
		disabled={isSubmitting}
	>
		{#if isSubmitting}
			<div class="w-5 h-5 border-2 border-t-gray-900 dark:border-t-white border-gray-200 dark:border-white/20 rounded-full animate-spin" />
		{:else}
			<Search size={20} />
		{/if}
		{isSubmitting ? 'Finding movies...' : 'Find Movies'}
	</Button>
</form>
