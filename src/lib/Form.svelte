<script lang="ts">
	import LoadingIndicator from './Loading.svelte';
	import { fade, slide, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { createEventDispatcher } from 'svelte';

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
		{ id: 'hbo', name: 'HBO Max', logo: '/platforms/hbo.svg' }
	];

	const cinemaTypes = [
		{ 
			value: 'movie', 
			title: 'Movie',
			icon: `<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>`
		},
		{ 
			value: 'tv show', 
			title: 'TV Show',
			icon: `<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path d="M20 7H4a1 1 0 00-1 1v11a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
				<path d="M16 3l-4 4-4-4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>`
		},
		{ 
			value: 'tv show or movie', 
			title: 'No Preference',
			icon: `<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
				<path d="M9 10h.01M15 10h.01M9.5 15a3.5 3.5 0 007 0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>`
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

<div class="fixed top-0 left-0 w-full h-1 bg-[#221F1F] z-50">
	<div 
		class="h-full bg-[#E50914]"
		style="width: {progress}%"
		transition:slide
	></div>
</div>

<div class="max-w-3xl mx-auto pt-24 pb-20 md:pt-28 md:pb-6 text-[#FFFFFF]">
	<!-- Step Progress -->
	<div class="flex justify-between mb-12 px-4">
		{#each Array(totalSteps) as _, i}
			<div class="flex flex-col items-center">
				<div class="relative">
					<div 
						class={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
							currentStep > i 
								? 'bg-[#E50914]' 
								: currentStep === i + 1 
									? 'bg-[#B20710]' 
									: 'bg-[#221F1F] border border-[#E50914]/20'
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
								currentStep > i ? 'bg-[#E50914]' : 'bg-[#221F1F]'
							}`} 
						/>
					{/if}
				</div>
				<span class="mt-2 text-xs font-medium text-[#FFFFFF]/70">
					{#if i === 0}
						Type
					{:else if i === 1}
						Platforms
					{:else if i === 2}
						Genres
					{:else}
						Preferences
					{/if}
				</span>
			</div>
		{/each}
	</div>

	<div class="space-y-10">
		<!-- Step 1: Cinema Type -->
		{#if currentStep === 1}
			<div class="bg-[#221F1F] border border-[#E50914]/20 rounded-xl p-8" in:fly={{ y: 50, duration: 300 }} out:fly={{ y: -50, duration: 300 }}>
				<h2 class="mb-6 font-bold text-2xl text-[#FFFFFF]">What are you in the mood for?</h2>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
					{#each cinemaTypes as type (type.value)}
						<button
							on:click={() => {
								cinemaType = type.value;
								nextStep();
							}}
							class={`group p-6 rounded-xl border-2 transition-all duration-300 ${
								cinemaType === type.value 
									? 'bg-[#E50914]/20 border-[#E50914]' 
									: 'bg-[#221F1F] border-[#E50914]/20 hover:border-[#E50914] hover:bg-[#E50914]/10'
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
			</div>
		{/if}

		<!-- Step 2: Streaming Platforms -->
		{#if currentStep === 2}
			<div class="bg-[#221F1F] border border-[#E50914]/20 rounded-xl p-8" in:fly={{ y: 50, duration: 300 }} out:fly={{ y: -50, duration: 300 }}>
				<h2 class="mb-6 font-bold text-2xl text-[#FFFFFF]">Where do you watch?</h2>
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
									? 'bg-[#E50914]/20 border-[#E50914]' 
									: 'bg-[#221F1F] border-[#E50914]/20 hover:border-[#E50914] hover:bg-[#E50914]/10'
							}`}
						>
							<div class="flex flex-col items-center text-center space-y-4">
								<img src={platform.logo} alt={platform.name} class="h-8 w-auto" />
								<span class="font-medium text-lg">{platform.name}</span>
							</div>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Step 3: Genres -->
		{#if currentStep === 3}
			<div class="bg-[#221F1F] border border-[#E50914]/20 rounded-xl p-8" in:fly={{ y: 50, duration: 300 }} out:fly={{ y: -50, duration: 300 }}>
				<h2 class="mb-6 font-bold text-2xl text-[#FFFFFF]">What genres interest you?</h2>
				
				<!-- Popular Categories -->
				<div class="mb-8">
					<h3 class="text-sm font-medium text-[#FFFFFF]/70 mb-4">Popular Genres</h3>
					<div class="flex flex-wrap gap-2">
						{#each popularCategories as category}
							<button
								on:click={() => handleGenreClick(category)}
								class={`px-4 py-2 rounded-lg border-2 transition-all duration-300 ${
									selectedCategories.includes(category)
										? 'bg-[#E50914]/20 border-[#E50914] text-[#FFFFFF]'
										: 'bg-[#221F1F] border-[#E50914]/20 text-[#FFFFFF]/70 hover:border-[#E50914] hover:bg-[#E50914]/10 hover:text-[#FFFFFF]'
								}`}
							>
								{category}
							</button>
						{/each}
					</div>
				</div>

				<!-- Specialized Categories -->
				<div>
					<h3 class="text-sm font-medium text-[#FFFFFF]/70 mb-4">More Genres</h3>
					<input
						type="text"
						bind:value={searchTerm}
						placeholder="Search genres..."
						class="w-full mb-4 px-4 py-3 bg-[#221F1F] border-2 border-[#E50914]/20 rounded-lg text-[#FFFFFF] placeholder-[#FFFFFF]/40 focus:border-[#E50914] focus:outline-none transition-colors duration-300"
					/>
					<div class="flex flex-wrap gap-2">
						{#each filteredCategories as category}
							<button
								on:click={() => handleGenreClick(category)}
								class={`px-4 py-2 rounded-lg border-2 transition-all duration-300 ${
									selectedCategories.includes(category)
										? 'bg-[#E50914]/20 border-[#E50914] text-[#FFFFFF]'
										: 'bg-[#221F1F] border-[#E50914]/20 text-[#FFFFFF]/70 hover:border-[#E50914] hover:bg-[#E50914]/10 hover:text-[#FFFFFF]'
								}`}
							>
								{category}
							</button>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- Step 4: Additional Preferences -->
		{#if currentStep === 4}
			<div class="bg-[#221F1F] border border-[#E50914]/20 rounded-xl p-8" in:fly={{ y: 50, duration: 300 }} out:fly={{ y: -50, duration: 300 }}>
				<h2 class="mb-6 font-bold text-2xl text-[#FFFFFF]">Any specific preferences?</h2>
				<textarea
					bind:value={specificDescriptors}
					class="w-full h-32 px-4 py-3 bg-[#221F1F] border-2 border-[#E50914]/20 rounded-lg text-[#FFFFFF] placeholder-[#FFFFFF]/40 focus:border-[#E50914] focus:outline-none resize-none transition-colors duration-300"
					placeholder="Tell us more about what you're looking for... (e.g., 'Released after 2010, with strong female lead')"
				/>
			</div>
		{/if}

		<!-- Navigation -->
		<div class="flex justify-between items-center mt-8">
			<button
				on:click={prevStep}
				class="px-6 py-3 rounded-lg bg-[#221F1F] text-[#FFFFFF] border-2 border-[#E50914]/20 hover:bg-[#E50914]/10 hover:border-[#E50914] transition-all duration-300"
				disabled={currentStep === 1}
			>
				Previous Step
			</button>
			{#if currentStep === totalSteps}
				<button
					on:click={handleSubmit}
					class="px-6 py-3 rounded-lg bg-[#E50914] text-[#FFFFFF] hover:bg-[#B20710] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={loading}
				>
					{#if loading}
						<div class="flex items-center space-x-2">
							<LoadingIndicator />
							<span>Finding Matches...</span>
						</div>
					{:else}
						Get Recommendations
					{/if}
				</button>
			{:else}
				<button
					on:click={nextStep}
					class="px-6 py-3 rounded-lg bg-[#E50914] text-[#FFFFFF] hover:bg-[#B20710] transition-all duration-300"
				>
					Next Step
				</button>
			{/if}
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
</style>
