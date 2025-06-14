<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore, setAuth } from '$lib/stores/auth';
	import { Loader2, AlertCircle, Mail, Lock, ArrowRight } from 'lucide-svelte';
	import { i18nStore } from '$lib/i18n';
	import LanguageSwitcher from '$lib/LanguageSwitcher.svelte';

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
				error = data.error || $i18nStore.t('login.invalid_credentials');
			} else {
				// Use the enhanced auth store
				setAuth(data.access_token, data.expires_in, data.user || { email });
				goto('/');
			}
		} catch (e) {
			error = $i18nStore.t('login.server_error');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{$i18nStore.t('login.sign_in')} | Watsch</title>
	<meta
		name="description"
		content={$i18nStore.t('login.subtitle')}
	/>
</svelte:head>

<div class="h-screen flex flex-col justify-center items-center p-4">
	<div class="w-full max-w-md">
		<!-- Logo and title -->
		<div class="text-center mb-8">
			<div class="flex justify-center">
				<a href="/" class="text-2xl font-bold inline-flex items-center">
					<span class="text-gray-900 dark:text-white">Wat</span>
					<span class="text-red-500">sch</span>
				</a>
			</div>
			<h1 class="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{$i18nStore.t('login.title')}</h1>
			<p class="mt-2 text-gray-600 dark:text-gray-400">{$i18nStore.t('login.subtitle')}</p>
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
					<label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
						{$i18nStore.t('email', 'Email')}
					</label>
					<div class="relative">
						<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Mail class="h-5 w-5 text-gray-400" />
						</div>
						<input
							id="email"
							type="email"
							bind:value={email}
							required
							placeholder={$i18nStore.t('email_placeholder', 'Enter your email')}
							class="block w-full pl-10 pr-3 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-150"
						/>
					</div>
				</div>

				<div class="space-y-2">
					<label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
						{$i18nStore.t('password', 'Password')}
					</label>
					<div class="relative">
						<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Lock class="h-5 w-5 text-gray-400" />
						</div>
						<input
							id="password"
							type="password"
							bind:value={password}
							required
							placeholder={$i18nStore.t('password_placeholder', 'Enter your password')}
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
						<label for="remember-me" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
							{$i18nStore.t('remember_me', 'Remember me')}
						</label>
					</div>
					<a href="/reset-password" class="text-sm font-medium text-red-600 hover:text-red-500">
						{$i18nStore.t('forgot_password', 'Forgot password?')}
					</a>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="w-full py-3 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
				>
					{#if loading}
						<Loader2 class="h-5 w-5 animate-spin" />
						<span>{$i18nStore.t('login.signing_in')}</span>
					{:else}
						<span>{$i18nStore.t('sign_in', 'Sign In')}</span>
						<ArrowRight class="h-5 w-5" />
					{/if}
				</button>
			</form>

			<div class="mt-6 text-center">
				<p class="text-sm text-gray-600 dark:text-gray-400">
					{$i18nStore.t('no_account', "Don't have an account?")}
					<a href="/register" class="font-medium text-red-600 hover:text-red-500">{$i18nStore.t('sign_up', 'Sign Up')}</a>
				</p>
			</div>
		</div>
	</div>
</div>
