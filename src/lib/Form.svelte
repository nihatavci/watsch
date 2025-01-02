<script lang="ts">
	import LoadingIndicator from './Loading.svelte';
	import { fade, slide, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { createEventDispatcher } from 'svelte';
	import Button from './ui/button.svelte';
	import Badge from './ui/badge.svelte';
	import { i18nStore } from './i18n';

	const dispatch = createEventDispatcher();

	export let cinemaType: string = '';
	export let selectedCategories: string[] = [];
	export let specificDescriptors: string = '';
	export let loading: boolean = false;
	export let selectedPlatforms: string[] = [];

	interface Platform {
		id: string;
		name: string;
		logo: string;
	}

	// Step navigation
	let currentStep = 1;
	const totalSteps = 4;

	const streamingPlatforms: Platform[] = [
		{ id: 'netflix', name: 'Netflix', logo: '/platforms/netflix.svg' },
		{ id: 'prime', name: 'Prime Video', logo: '/platforms/prime.svg' },
		{ id: 'hulu', name: 'Hulu', logo: '/platforms/hulu.svg' },
		{ id: 'disney', name: 'Disney+', logo: '/platforms/disney.svg' },
		{ id: 'hbo', name: 'HBO Max', logo: '/platforms/hbo.svg' },
		{ id: 'other', name: 'Other', logo: '/platforms/other.svg' }
	];

	const cinemaTypes = [
		{ 
			value: 'movie', 
			title: $i18nStore.t('form.cinema_types.movie'),
			icon: `<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>`,
			required: true,
			selectable: true
		},
		{ 
			value: 'tv show', 
			title: $i18nStore.t('form.cinema_types.tv_show'),
			icon: `<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path d="M20 7H4a1 1 0 00-1 1v11a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
				<path d="M16 3l-4 4-4-4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>`,
			required: true,
			selectable: true
		},
		{ 
			value: 'tv show or movie', 
			title: $i18nStore.t('form.cinema_types.no_preference'),
			icon: `<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
				<path d="M9 10h.01M15 10h.01M9.5 15a3.5 3.5 0 007 0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>`,
			required: true,
			selectable: true
		}
	];

	const popularCategories = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Thriller'];
	const specializedCategories = [
		'Adventure', 'Animation', 'Biography', 'Crime', 'Documentary', 'Family',
		'Fantasy', 'Film-Noir', 'History', 'Musical', 'Mystery', 'Sci-Fi',
		'Sport', 'War', 'Western', 'Art-house', 'Black-Comedy', 'Chick-flick',
		'Cult-classic', 'Dark-Comedy', 'Epic', 'Erotic', 'Experimental', 'Fairy-tale',
		'Film-within-a-film', 'Futuristic', 'Gangster', 'Heist', 'Historical',
		'Holiday', 'Indie', 'Juvenile', 'Melodrama', 'Monster', 'Political',
		'Psychological', 'Road-movie', 'Satire', 'Science-Fiction', 'Slapstick',
		'Social-issue', 'Superhero', 'Surreal', 'Teen', 'Vampire', 'Zombie'
	];

	let searchTerm = '';
	$: filteredCategories = specializedCategories.filter(cat => 
		cat.toLowerCase().includes(searchTerm.toLowerCase())
	);

	function nextStep() {
		if (currentStep < totalSteps) {
			currentStep++;
		}
	}

	function prevStep() {
		if (currentStep > 1) {
			currentStep--;
		}
	}

	// Progress calculation
	$: progress = (currentStep / totalSteps) * 100;

	// Add validation state
	let showError = false;

	function handleSubmit() {
		if (!cinemaType) {
			showError = true;
			return;
		}
		showError = false;
		dispatch('click');
	}

	function handleGenreClick(category: string) {
		const index = selectedCategories.indexOf(category);
		if (index === -1) {
			selectedCategories = [...selectedCategories, category];
		} else {
			selectedCategories = selectedCategories.filter(c => c !== category);
		}
	}
</script>

<div class="fixed top-0 left-0 w-full h-1 z-50 glass-card">
	<div 
		class="h-full bg-[#E50914]/80 backdrop-blur-sm"
		style="width: {progress}%"
		transition:slide
	></div>
</div>

<div class="max-w-3xl mx-auto pt-20 pb-32 md:pt-24 text-[#FFFFFF]">
	<!-- Step Progress -->
	<div class="flex justify-between mb-8 px-10 py-6 glass-card rounded-xl">
		{#each Array(totalSteps) as _, i}
			<div class="flex flex-col items-center">
				<div class="relative">
					<div 
						class={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm ${
							currentStep > i 
								? 'bg-[#E50914]/80' 
								: currentStep === i + 1 
									? 'bg-[#B20710]/80' 
									: 'bg-[#221F1F]/20 border border-[#E50914]/20'
						}`}
					>
						{#if currentStep > i}
							<svg class="w-5 h-5 text-[#FFFFFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
						{:else}
							<span class="text-[#FFFFFF]/90">{i + 1}</span>
						{/if}
					</div>
					{#if i < totalSteps - 1}
						<div 
							class={`absolute top-1/2 left-full w-[calc(100%-2.5rem)] h-0.5 -translate-y-1/2 transition-all duration-300 ${
								currentStep > i ? 'bg-[#E50914]/80' : 'bg-[#221F1F]/20'
							} backdrop-blur-sm`} 
						/>
					{/if}
				</div>
				<span class="mt-2 text-xs font-medium text-[#FFFFFF]/70">
					{$i18nStore.t(`form.steps.${i + 1}`)}
				</span>
			</div>
		{/each}
	</div>

	<div class="relative mb-24 glass-card rounded-xl p-6 backdrop-blur-sm">
		<!-- Step Content -->
		<div class="relative mb-24">
			{#each Array(totalSteps) as _, i}
				{#if currentStep === i + 1}
					<div
						in:fade={{ duration: 300 }}
						out:fade={{ duration: 300 }}
						class="relative"
					>
						<div class="bg-transparent border border-[#E50914]/20 rounded-xl p-6" 
							in:fly={{ y: 50, duration: 300, easing: quintOut }} 
							out:fly={{ y: -50, duration: 300, easing: quintOut }}
						>
							{#if i === 0}
								<h2 class="mb-4 font-bold text-xl text-[#FFFFFF]">{$i18nStore.t('form.questions.type')}</h2>
								<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
									{#each cinemaTypes as type (type.value)}
										<button
											on:click={() => {
												cinemaType = type.value;
												nextStep();
											}}
											class={`group p-6 rounded-xl border-2 transition-all duration-300 ${
												cinemaType === type.value 
													? 'bg-transparent border-[#E50914]' 
													: 'bg-transparent border-[#E50914]/20 hover:border-[#E50914] hover:bg-[#E50914]/10'
											}`}
										>
											<div class="flex flex-col items-center text-center space-y-4">
												<div class={`${
													cinemaType === type.value 
														? 'text-[#E50914]' 
														: 'text-[#FFFFFF]/70 group-hover:text-[#E50914]'
												} transition-colors duration-300`}>
													{@html type.icon}
												</div>
												<span class="font-medium text-lg">{type.title}</span>
											</div>
										</button>
									{/each}
								</div>
							{:else if i === 1}
								<h2 class="mb-4 font-bold text-xl text-[#FFFFFF]">{$i18nStore.t('form.questions.platforms')}</h2>
								<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
									{#each streamingPlatforms as platform (platform.id)}
										<button
											on:click={() => {
												const index = selectedPlatforms.indexOf(platform.id);
												if (index === -1) {
													selectedPlatforms = [...selectedPlatforms, platform.id];
												} else {
													selectedPlatforms = selectedPlatforms.filter(id => id !== platform.id);
												}
											}}
											class={`group p-6 rounded-xl border-2 transition-all duration-300 ${
												selectedPlatforms.includes(platform.id)
													? 'bg-transparent border-[#E50914]' 
													: 'bg-transparent border-[#E50914]/20 hover:border-[#E50914] hover:bg-[#E50914]/10'
											}`}
										>
											<div class="flex flex-col items-center text-center space-y-4">
												<img src={platform.logo} alt={platform.name} class="h-8 w-auto" />
												<span class="font-medium text-lg">{platform.name}</span>
											</div>
										</button>
									{/each}
								</div>
							{:else if i === 2}
								<h2 class="mb-4 font-bold text-xl text-[#FFFFFF]">{$i18nStore.t('form.questions.genres')}</h2>
								
								<!-- Popular Categories -->
								<div class="mb-8">
									<h3 class="text-sm font-medium text-[#FFFFFF]/70 mb-4">{$i18nStore.t('form.labels.popular_genres')}</h3>
									<div class="flex flex-wrap gap-2">
										{#each popularCategories as category}
											<button
												on:click={() => handleGenreClick(category)}
												class={`px-4 py-2 rounded-full transition-all duration-300 ${
													selectedCategories.includes(category)
														? 'bg-[#E50914]/10 border-2 border-[#E50914] text-[#FFFFFF] focus:ring-2 focus:ring-[#E50914] focus:ring-offset-2'
														: 'bg-transparent border border-[#E50914]/40 text-[#FFFFFF]/90 hover:border-[#E50914] hover:text-[#E50914] focus:ring-2 focus:ring-[#E50914] focus:ring-offset-2'
												}`}
											>
												{category}
											</button>
										{/each}
									</div>
								</div>

								<!-- Specialized Categories -->
								<div>
									<h3 class="text-sm font-medium text-[#FFFFFF]/70 mb-4">{$i18nStore.t('form.labels.specialized_genres')}</h3>
									<input
										type="text"
										bind:value={searchTerm}
										placeholder={$i18nStore.t('form.placeholders.search_genres')}
										class="w-full px-4 py-2 mb-4 bg-transparent border border-[#E50914]/20 rounded-lg text-[#FFFFFF] placeholder-[#FFFFFF]/50 focus:outline-none focus:border-[#E50914]"
									/>
									<div class="flex flex-wrap gap-2">
										{#each filteredCategories as category}
											<button
												on:click={() => handleGenreClick(category)}
												class={`px-4 py-2 rounded-full transition-all duration-300 ${
													selectedCategories.includes(category)
														? 'bg-[#E50914]/10 border-2 border-[#E50914] text-[#FFFFFF] focus:ring-2 focus:ring-[#E50914] focus:ring-offset-2'
														: 'bg-transparent border border-[#E50914]/40 text-[#FFFFFF]/90 hover:border-[#E50914] hover:text-[#E50914] focus:ring-2 focus:ring-[#E50914] focus:ring-offset-2'
												}`}
											>
												{category}
											</button>
										{/each}
									</div>
								</div>
							{:else if i === 3}
								<h2 class="mb-4 font-bold text-xl text-[#FFFFFF]">{$i18nStore.t('form.questions.preferences')}</h2>
								<div class="space-y-6">
									<div>
										<textarea
											bind:value={specificDescriptors}
											placeholder={$i18nStore.t('form.placeholders.preferences')}
											class="w-full h-32 px-4 py-3 bg-transparent border border-[#E50914]/20 rounded-lg text-[#FFFFFF] placeholder-[#FFFFFF]/50 focus:outline-none focus:border-[#E50914] resize-none"
										></textarea>
									</div>
									<div class="flex justify-end">
										<button
											on:click={handleSubmit}
											class="px-6 py-3 bg-[#E50914] text-white rounded-lg font-medium hover:bg-[#B20710] transition-colors duration-300 flex items-center space-x-2"
												disabled={loading}
										>
											{#if loading}
												<LoadingIndicator />
												<span>{$i18nStore.t('common.loading')}</span>
											{:else}
												<span>{$i18nStore.t('form.buttons.get_recommendations')}</span>
											{/if}
										</button>
									</div>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			{/each}
		</div>

		<!-- Navigation Buttons -->
		<div class="fixed bottom-0 left-0 right-0 rounded-xl bg-black/20 backdrop-blur-sm py-4 z-50">
			<div class="max-w-3xl mx-auto px-4 flex justify-between">
				{#if currentStep > 1}
					<button
						on:click={prevStep}
						class="glass-button px-6 py-2 rounded-lg text-[#FFFFFF]/90 hover:text-white transition-all duration-300"
					>
						{$i18nStore.t('form.buttons.previous')}
					</button>
				{:else}
					<div></div>
				{/if}

				{#if currentStep < totalSteps}
					<button
						on:click={nextStep}
						class="glass-button px-6 py-2 rounded-lg text-white font-medium hover:bg-[#B20710]/20 transition-colors duration-300"
					>
						{$i18nStore.t('form.buttons.next')}
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	:global(.geist-text) {
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
	}

	button:disabled {
		@apply opacity-50 cursor-not-allowed;
		background: #221F1F !important;
	}

	input:focus, textarea:focus {
		@apply border-[#E50914] outline-none ring-2 ring-[#E50914]/20;
	}

	:global(.glass-card) {
		background: rgba(255, 255, 255, 0.03);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
	}

	:global(.glass-button) {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition: all 0.3s ease;
	}

	:global(.glass-button:hover) {
		background: rgba(229, 9, 20, 0.1);
		border-color: rgba(229, 9, 20, 0.2);
		transform: translateY(-2px);
	}

	:global(.glass-badge) {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition: all 0.2s ease;
	}

	:global(.glass-badge:hover) {
		background: rgba(229, 9, 20, 0.1);
		border-color: rgba(229, 9, 20, 0.2);
	}

	:global(.glass-input) {
		background: rgba(255, 255, 255, 0.03);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition: all 0.3s ease;
	}

	:global(.glass-input:focus) {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(229, 9, 20, 0.3);
		box-shadow: 0 0 0 2px rgba(229, 9, 20, 0.1);
	}
</style>
