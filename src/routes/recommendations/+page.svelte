<script lang="ts">
	import Form from '$lib/Form.svelte';
	import RecommendationCard from '$lib/RecommendationCard.svelte';
	import { library } from '../../stores/library';
	import { fade } from 'svelte/transition';
	import { i18nStore } from '$lib/i18n';

	let cinemaType = '';
	let selectedCategories: string[] = [];
	let specificDescriptors = '';
	let loading = false;
	let recommendations: Array<{ title: string; description: string }> = [];
	let selectedPlatforms: string[] = [];
	let error: string | null = null;

	async function getRecommendations() {
		loading = true;
		error = null;
		recommendations = [];

		try {
			// Construct the search criteria
			let searchCriteria = `Give me a list of 5 ${cinemaType} recommendations`;
			if (selectedCategories.length > 0) {
				searchCriteria += ` that fit these categories: ${selectedCategories.join(', ')}`;
			}
			if (selectedPlatforms.length > 0) {
				searchCriteria += ` available on ${selectedPlatforms.join(' or ')}`;
			}
			if (specificDescriptors) {
				searchCriteria += `. Additional preferences: ${specificDescriptors}`;
			}
			searchCriteria += `. Please return this response as a numbered list with the ${cinemaType}'s title, followed by a colon, and then a brief description.`;

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
				const errorText = await response.text();
				let errorMessage: string;
				
				try {
					const errorData = JSON.parse(errorText);
					errorMessage = errorData.error?.message || $i18nStore.t('common.error');
				} catch {
					errorMessage = errorText || $i18nStore.t('common.error');
				}
				
				throw new Error(errorMessage);
			}

			// Handle streaming response
			const reader = response.body?.getReader();
			if (!reader) {
				throw new Error($i18nStore.t('recommendations.error.stream'));
			}

			let accumulatedResponse = '';
			const decoder = new TextDecoder();

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				
				accumulatedResponse += decoder.decode(value, { stream: true });
			}

			// Process the accumulated response
			const lines = accumulatedResponse.split('\n').filter(line => line.trim());
			const processedRecommendations = lines.map(line => {
				const match = line.match(/\d+\.\s*(.*?):\s*(.*)/);
				if (!match) return null;
				const [, title, description] = match;
				return { title, description };
			}).filter((rec): rec is { title: string; description: string } => rec !== null);

			// Add search to history
			library.addToHistory(searchCriteria);

			recommendations = processedRecommendations;
		} catch (err) {
			console.error('Error getting recommendations:', err);
			// Instead of setting an error, just log it and continue with any successfully processed recommendations
			console.warn($i18nStore.t('recommendations.error.partial'));
		} finally {
			loading = false;
		}
	}

	function dismissRecommendation(index: number) {
		recommendations = recommendations.filter((_, i) => i !== index);
	}
</script>

<div class="max-w-3xl mx-auto pt-10 pb-10 md:pt-16 md:pb-6 text-[#FFFFFF]">
	{#if recommendations.length === 0}
		<div in:fade>
			<Form
				bind:cinemaType
				bind:selectedCategories
				bind:specificDescriptors
				bind:loading
				bind:selectedPlatforms
				on:click={getRecommendations}
			/>
			{#if error}
				<div class="mt-4 p-4 rounded-xl bg-red-500/10 text-red-400">
					{error}
				</div>
			{/if}
		</div>
	{:else}
		<div class="max-w-4xl mx-auto px-8 mt-12">
			<div class="space-y-6">
				{#each recommendations as recommendation, index}
					<RecommendationCard
						{recommendation}
						{selectedPlatforms}
						{index}
						onDismiss={() => dismissRecommendation(index)}
					/>
				{/each}
			</div>
		</div>
	{/if}
</div> 