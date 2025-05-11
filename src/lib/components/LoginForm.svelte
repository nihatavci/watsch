<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore, setAuth } from '$lib/stores/auth';
	import { Loader2, AlertCircle, Mail, Lock, ArrowRight } from 'lucide-svelte';

	let email = '';
	let password = '';
	let error = '';
	let loading = false;
	let rememberMe = false;

	async function handleLogin() {
		if (!email || !password) return;

		error = '';
		loading = true;
		try {
			const res = await fetch('/api/auth', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});
			const data = await res.json();
			if (!res.ok) {
				error = data.error || 'Invalid email or password';
			} else {
				// Use the enhanced auth store
				setAuth(data.access_token, data.expires_in, data.user || { email });
				goto('/');
			}
		} catch (e) {
			error = 'Unable to connect to server. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Login | Watsch</title>
	<meta
		name="description"
		content="Login to your Watsch account to access personalized movie recommendations."
	/>
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-black">
	<div class="w-full max-w-md">
		<!-- Logo and title -->
		<div class="text-center mb-8">
			<div class="flex justify-center">
				<a href="/" class="text-2xl font-bold inline-flex items-center">
					<span class="text-gray-900 dark:text-white">Wat</span>
					<span class="text-red-500">sch</span>
				</a>
			</div>
			<h1 class="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
			<p class="mt-2 text-gray-600 dark:text-gray-400">Sign in to your account</p>
		</div>

		<!-- Login form -->
		<div
			class="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8"
		>
			<form on:submit|preventDefault={handleLogin} class="space-y-6">
				{#if error}
					<div
						class="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-start gap-3 border border-red-100 dark:border-red-800/50 text-sm"
					>
						<AlertCircle class="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
						<p class="text-red-800 dark:text-red-300">{error}</p>
					</div>
				{/if}

				<div class="space-y-2">
					<label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>Email address</label
					>
					<div class="relative">
						<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Mail class="h-5 w-5 text-gray-400" />
						</div>
						<input
							id="email"
							type="email"
							bind:value={email}
							required
							placeholder="you@example.com"
							class="block w-full pl-10 pr-3 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-150"
						/>
					</div>
				</div>

				<div class="space-y-2">
					<label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>Password</label
					>
					<div class="relative">
						<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Lock class="h-5 w-5 text-gray-400" />
						</div>
						<input
							id="password"
							type="password"
							bind:value={password}
							required
							placeholder="••••••••"
							class="block w-full pl-10 pr-3 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-150"
						/>
					</div>
				</div>

				<div class="flex items-center justify-between">
					<div class="flex items-center">
						<input
							id="remember-me"
							type="checkbox"
							bind:checked={rememberMe}
							class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
						/>
						<label for="remember-me" class="ml-2 block text-sm text-gray-700 dark:text-gray-300"
							>Remember me</label
						>
					</div>
					<a href="/reset-password" class="text-sm font-medium text-red-600 hover:text-red-500"
						>Forgot password?</a
					>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="w-full py-3 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
				>
					{#if loading}
						<Loader2 class="h-5 w-5 animate-spin" />
						<span>Signing in...</span>
					{:else}
						<span>Sign in</span>
						<ArrowRight class="h-5 w-5" />
					{/if}
				</button>
			</form>

			<div class="mt-6 text-center">
				<p class="text-sm text-gray-600 dark:text-gray-400">
					Don't have an account?
					<a href="/register" class="font-medium text-red-600 hover:text-red-500">Sign up</a>
				</p>
			</div>
		</div>
	</div>
</div>
