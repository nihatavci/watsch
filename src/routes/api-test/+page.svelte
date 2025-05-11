<script lang="ts">
	import { onMount } from 'svelte';
	import { Loader2 } from 'lucide-svelte';

	interface EnvVariable {
		exists: boolean;
		preview?: string;
		length?: number;
	}

	interface EnvStatus {
		message: string;
		variables: Record<string, EnvVariable>;
	}

	let envStatus: EnvStatus | null = null;
	let loadingEnv = true;
	let testResult: string | null = null;
	let testError: string | null = null;
	let loading = false;
	let prompt = "Write a brief 2-sentence review of the movie 'Inception'";

	// Check environment variables on load
	onMount(async () => {
		try {
			const response = await fetch('/api/check-env');
			envStatus = await response.json();
		} catch (error) {
			console.error(
				'Error checking env variables:',
				error instanceof Error ? error.message : String(error)
			);
		} finally {
			loadingEnv = false;
		}
	});

	// Test OpenAI integration
	async function testOpenAI() {
		testResult = null;
		testError = null;
		loading = true;

		try {
			const response = await fetch('/api/openai-proxy', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					model: 'gpt-3.5-turbo',
					messages: [{ role: 'user', content: prompt }],
					temperature: 0.7,
					max_tokens: 150
				})
			});

			const data = await response.json();

			if (!response.ok) {
				testError = data.error || 'Unknown error';
			} else {
				testResult = data.choices[0]?.message?.content || 'No response generated';
			}
		} catch (error) {
			console.error('Error testing OpenAI:', error);
			testError = error instanceof Error ? error.message : 'Failed to connect to OpenAI';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>API Test | Watsch</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-2xl font-bold mb-6">API Integration Test</h1>

	<!-- Environment Variables Status -->
	<div class="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
		<h2 class="text-xl font-semibold mb-4">Environment Variables</h2>

		{#if loadingEnv}
			<div class="flex items-center gap-2 text-gray-600 dark:text-gray-300">
				<Loader2 class="w-4 h-4 animate-spin" />
				<span>Checking environment variables...</span>
			</div>
		{:else if envStatus}
			<div class="grid gap-2">
				{#each Object.entries(envStatus.variables) as [key, value]}
					<div class="p-2 border border-gray-200 dark:border-gray-700 rounded">
						<span class="font-medium">{key}:</span>
						<span class="ml-2">
							{#if value.exists}
								<span class="text-green-600 dark:text-green-400">Available</span>
								{#if value.preview}
									<span class="text-gray-500 ml-2">{value.preview}</span>
								{/if}
								{#if value.length}
									<span class="text-gray-500 ml-2">(length: {value.length})</span>
								{/if}
							{:else}
								<span class="text-red-600 dark:text-red-400">Not set</span>
							{/if}
						</span>
					</div>
				{/each}
			</div>
		{:else}
			<p class="text-red-600 dark:text-red-400">Failed to load environment variables.</p>
		{/if}
	</div>

	<!-- OpenAI Test -->
	<div class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
		<h2 class="text-xl font-semibold mb-4">Test OpenAI Integration</h2>

		<div class="mb-4">
			<label for="prompt" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
				>Prompt:</label
			>
			<textarea
				id="prompt"
				bind:value={prompt}
				rows="3"
				class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
			/>
		</div>

		<button
			on:click={testOpenAI}
			disabled={loading}
			class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
		>
			{#if loading}
				<Loader2 class="w-4 h-4 animate-spin" />
				<span>Testing...</span>
			{:else}
				<span>Test OpenAI</span>
			{/if}
		</button>

		{#if testResult}
			<div
				class="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg"
			>
				<h3 class="font-semibold text-green-800 dark:text-green-300 mb-2">Result:</h3>
				<p class="text-gray-800 dark:text-gray-200">{testResult}</p>
			</div>
		{/if}

		{#if testError}
			<div
				class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg"
			>
				<h3 class="font-semibold text-red-800 dark:text-red-300 mb-2">Error:</h3>
				<p class="text-gray-800 dark:text-gray-200">{testError}</p>
			</div>
		{/if}
	</div>
</div>
