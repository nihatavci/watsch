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
		icon: string;
	}

	// Step navigation
	let currentStep = 1;
	const totalSteps = 4;

	const streamingPlatforms: Platform[] = [
		{ id: 'netflix', name: 'Netflix', icon: '🎬' },
		{ id: 'prime', name: 'Amazon Prime', icon: '📺' },
		{ id: 'hulu', name: 'Hulu', icon: '🎥' },
		{ id: 'disney', name: 'Disney+', icon: '✨' },
		{ id: 'hbo', name: 'HBO Max', icon: '🎭' }
	];

	const cinemaTypes = [
		{ value: 'movie', title: 'Movie', icon: '🎬' },
		{ value: 'tv show', title: 'TV Show', icon: '📺' },
		{ value: 'tv show or movie', title: 'No Preference', icon: '🎯' }
	];

	const categoryTypes = [
		'Action', 'Adventure', 'Animation', 'Biography', 'Comedy',
		'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy',
		'Film-Noir', 'History', 'Horror', 'Musical', 'Mystery',
		'Romance', 'Sci-Fi', 'Sport', 'Thriller', 'War',
		'Western', 'Art-house', 'Black-Comedy', 'Chick-flick',
		'Cult-classic', 'Dark-Comedy', 'Epic', 'Erotic',
		'Experimental', 'Fairy-tale', 'Film-within-a-film',
		'Futuristic', 'Gangster', 'Heist', 'Historical',
		'Holiday', 'Indie', 'Juvenile', 'Melodrama', 'Monster',
		'Political', 'Psychological', 'Road-movie', 'Satire',
		'Science-Fiction', 'Slapstick', 'Social-issue',
		'Superhero', 'Surreal', 'Teen', 'Vampire', 'Zombie'
	];

	// Group categories by type for better organization
	const popularCategories = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Thriller'];
	const specializedCategories = categoryTypes.filter(cat => !popularCategories.includes(cat));

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
</script>

<div class="fixed top-0 left-0 w-full h-1 bg-neutral-800/30 backdrop-blur-sm z-50">
	<div 
		class="h-full bg-gradient-to-r from-pink-600/80 to-purple-600/80 backdrop-blur-sm"
		style="width: {progress}%"
		transition:slide
	></div>
</div>

<div class="max-w-3xl mx-auto pt-6 pb-20 md:pt-10 md:pb-6 text-slate-200">
	<!-- Desktop Steps Progress -->
	<div class="hidden md:flex justify-between mb-8">
		{#each Array(totalSteps) as _, i}
			<div class="flex items-center">
				<div class={`w-8 h-8 rounded-full flex items-center justify-center ${
					currentStep > i ? 'bg-gradient-to-r from-pink-600 to-purple-600' :
					currentStep === i + 1 ? 'bg-gradient-to-r from-pink-600/50 to-purple-600/50' :
					'bg-white/[0.02]'
				}`}>
					{#if currentStep > i}
						<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					{:else}
						<span class="text-white/70">{i + 1}</span>
					{/if}
				</div>
				{#if i < totalSteps - 1}
					<div class={`w-full h-0.5 mx-2 ${currentStep > i ? 'bg-gradient-to-r from-pink-600 to-purple-600' : 'bg-white/[0.02]'}`} />
				{/if}
			</div>
		{/each}
	</div>

	<div class="space-y-10">
		<!-- Step 1: Cinema Type -->
		{#if currentStep === 1}
			<div class="gradient-border glassmorphism p-6" in:fly={{ y: 50, duration: 300 }} out:fly={{ y: -50, duration: 300 }}>
				<h2 class="mb-4 font-bold text-xl bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">What are you in the mood for?</h2>
				<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
					{#each cinemaTypes as type (type.value)}
						<button
							on:click={() => {
								cinemaType = type.value;
								nextStep();
							}}
							class={`${
								cinemaType === type.value 
									? 'bg-gradient-to-r from-pink-600/30 to-purple-600/30 border-pink-500/50' 
									: 'bg-white/[0.02] border-white/[0.05] hover:border-pink-500/30'
							} glassmorphism transition-all duration-300 flex items-center justify-center space-x-2 py-6 px-6 rounded-lg border-2`}
						>
							<span class="text-3xl">{type.icon}</span>
							<span class="font-medium text-lg">{type.title}</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Step 2: Streaming Platforms -->
		{#if currentStep === 2}
			<div class="gradient-border glassmorphism p-6" in:fly={{ y: 50, duration: 300 }} out:fly={{ y: -50, duration: 300 }}>
				<h2 class="mb-4 font-bold text-xl bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">Where do you watch?</h2>
				<div class="grid grid-cols-2 md:grid-cols-3 gap-3">
					{#each streamingPlatforms as platform (platform.id)}
						<label
							class={`${
								selectedPlatforms.includes(platform.id)
									? 'bg-gradient-to-r from-pink-600/30 to-purple-600/30 border-pink-500/50'
									: 'bg-white/[0.02] border-white/[0.05] hover:border-pink-500/30'
							} glassmorphism transition-all duration-300 cursor-pointer flex flex-col items-center justify-center p-6 rounded-lg border-2`}
						>
							<input
								type="checkbox"
								class="hidden"
								bind:group={selectedPlatforms}
								value={platform.id}
								on:change={() => {
									if (window.innerWidth >= 768 && selectedPlatforms.length > 0) {
										nextStep();
									}
								}}
							/>
							<span class="text-3xl mb-3">{platform.icon}</span>
							<span class="text-lg font-medium text-center">{platform.name}</span>
						</label>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Step 3: Genres -->
		{#if currentStep === 3}
			<div class="gradient-border glassmorphism p-6" in:fly={{ y: 50, duration: 300 }} out:fly={{ y: -50, duration: 300 }}>
				<h2 class="mb-4 font-bold text-xl bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">What genres interest you?</h2>
				
				<!-- Popular Categories -->
				<div class="mb-6">
					<h3 class="text-sm uppercase text-white/50 mb-3">Popular Genres</h3>
					<div class="flex flex-wrap gap-2">
						{#each popularCategories as category}
							<label
								class={`${
									selectedCategories.includes(category) 
										? 'bg-gradient-to-r from-pink-600/30 to-purple-600/30 border-pink-500/50'
										: 'bg-white/[0.02] border-white/[0.05] hover:border-pink-500/30'
								} glassmorphism transition-all duration-300 cursor-pointer px-4 py-2 rounded-lg border-2`}
							>
								<input
									class="hidden"
									type="checkbox"
									bind:group={selectedCategories}
									name="categories"
									value={category}
								/>
								{category}
							</label>
						{/each}
					</div>
				</div>

				<!-- Specialized Categories with Search -->
				<div>
					<h3 class="text-sm uppercase text-white/50 mb-3">More Genres</h3>
					<input
						type="text"
						bind:value={searchTerm}
						placeholder="Search genres..."
						class="w-full mb-3 px-4 py-2 bg-white/[0.02] border border-white/[0.05] rounded-lg focus:border-pink-500 focus:outline-none"
					/>
					<div class="flex flex-wrap gap-2">
						{#each filteredCategories as category}
							<label
								class={`${
									selectedCategories.includes(category) 
										? 'bg-gradient-to-r from-pink-600/30 to-purple-600/30 border-pink-500/50'
										: 'bg-white/[0.02] border-white/[0.05] hover:border-pink-500/30'
								} glassmorphism transition-all duration-300 cursor-pointer px-4 py-2 rounded-lg border-2`}
							>
								<input
									class="hidden"
									type="checkbox"
									bind:group={selectedCategories}
									name="categories"
									value={category}
								/>
								{category}
							</label>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- Step 4: Additional Preferences -->
		{#if currentStep === 4}
			<div class="gradient-border glassmorphism p-6" in:fly={{ y: 50, duration: 300 }} out:fly={{ y: -50, duration: 300 }}>
				<h2 class="mb-4 font-bold text-xl bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">Any specific preferences?</h2>
				<textarea
					bind:value={specificDescriptors}
					class="w-full h-32 px-4 py-3 bg-white/[0.02] border border-white/[0.05] rounded-lg focus:border-pink-500 focus:outline-none resize-none"
					placeholder="Tell us more about what you're looking for... (e.g., 'Released after 2010, with strong female lead')"
				/>

				<!-- Submit Button -->
				<div class="mt-6">
					<button
						type="button"
						on:click={handleSubmit}
						class={`${
							loading
								? 'bg-neutral-700 cursor-not-allowed'
								: 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 cursor-pointer'
						} w-full py-4 rounded-xl transition-all duration-200 shadow-lg text-white`}
						disabled={loading}
					>
						{#if loading}
							<div class="flex items-center justify-center gap-2">
								<LoadingIndicator />
								<span class="font-bold text-lg">Finding Matches...</span>
							</div>
						{:else}
							<span class="font-bold text-lg">Find My Perfect Match</span>
						{/if}
					</button>
					{#if showError}
						<div class="mt-2 text-red-400 text-sm flex items-center gap-2" transition:fade>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
							</svg>
							<span>Please select what you're in the mood for before submitting</span>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<!-- Desktop Navigation -->
	<div class="hidden md:flex justify-between items-center mt-8">
		<button
			on:click={prevStep}
			class="px-6 py-3 rounded-lg bg-white/[0.02] text-slate-200 border border-white/[0.05] transition-all duration-300 hover:bg-white/[0.05]"
			disabled={currentStep === 1}
		>
			Previous Step
		</button>
		{#if currentStep === totalSteps}
			<button
				on:click={() => dispatch('click')}
				class="px-6 py-3 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 text-white transition-all duration-300 hover:opacity-90"
				disabled={loading}
			>
				{#if loading}
					<div class="flex items-center space-x-2">
						<LoadingIndicator />
						<span>Getting Recommendations...</span>
					</div>
				{:else}
					Get Recommendations
				{/if}
			</button>
		{:else}
			<button
				on:click={nextStep}
				class="px-6 py-3 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 text-white transition-all duration-300 hover:opacity-90"
			>
				Next Step
			</button>
		{/if}
	</div>

	<!-- Mobile Navigation -->
	<div class="md:hidden fixed bottom-0 left-0 w-full glassmorphism border-t border-white/[0.05] p-4 z-50">
		<div class="flex justify-between items-center">
			<button
				on:click={prevStep}
				class="px-4 py-2 rounded-lg bg-white/[0.02] text-slate-200 border border-white/[0.05] transition-all duration-300"
				disabled={currentStep === 1}
			>
				Previous
			</button>
			<span class="text-slate-400">Step {currentStep} of {totalSteps}</span>
			{#if currentStep === totalSteps}
				<button
					on:click={() => dispatch('click')}
					class="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 text-white transition-all duration-300"
					disabled={loading}
				>
					{#if loading}
						<LoadingIndicator />
					{:else}
						Get Results
					{/if}
				</button>
			{:else}
				<button
					on:click={nextStep}
					class="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-600/80 to-purple-600/80 text-white transition-all duration-300"
				>
					Next
				</button>
			{/if}
		</div>
	</div>
</div>

<style lang="postcss">
	:global(.glassmorphism) {
		@apply backdrop-blur-lg bg-white/[0.02] border border-white/[0.05] shadow-xl;
	}

	:global(.gradient-border) {
		position: relative;
		border-radius: theme('borderRadius.xl');
		background: linear-gradient(45deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
	}

	:global(.gradient-border::before) {
		content: '';
		position: absolute;
		inset: -1px;
		border-radius: theme('borderRadius.xl');
		padding: 1px;
		background: linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02));
		-webkit-mask: 
			linear-gradient(#fff 0 0) content-box, 
			linear-gradient(#fff 0 0);
		mask: 
			linear-gradient(#fff 0 0) content-box, 
			linear-gradient(#fff 0 0);
		-webkit-mask-composite: xor;
		mask-composite: exclude;
	}
</style>
