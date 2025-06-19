<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Home, Star, Bookmark, Moon, Sun } from 'lucide-svelte';
	import { theme, toggleTheme } from '$lib/stores/theme';
	import { isAuthenticated, clearAuth, authStore } from '$lib/stores/auth';
	import { browser } from '$app/environment';
	import { savedIconPulse } from '../../../stores/ui';
	import gsap from 'gsap';
	import { i18nStore } from '$lib/i18n';
	import LanguageSwitcher from '$lib/LanguageSwitcher.svelte';

	// Navigation items (matching the main app structure)
	const navItems = [
		{ key: 'navigation.home', url: '/', icon: Home },
		{ key: 'navigation.recommendations', url: '/recommendations', icon: Star },
		{ key: 'navigation.saved', url: '/saved', icon: Bookmark }
	];

	let currentPath: string;
	let pulseSaved = false;

	// Subscribe to the page store to get the current path
	$: currentPath = $page.url.pathname;

	// Subscribe to pulse effect store
	onMount(() => {
		const unsubscribe = savedIconPulse.subscribe((value) => {
			pulseSaved = value;
		});

		return unsubscribe;
	});

	function handleLogout() {
		if (browser) {
			clearAuth();
			goto('/');
		}
	}
</script>

<div class="hidden md:block">
	<header class="z-50 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 fixed inset-x-0 top-0">
		<div class="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
			<!-- Logo -->
			<a href="/" class="flex items-center gap-2 group">
				<svg class="h-8 w-8" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
					<rect x="8" y="8" width="24" height="24" rx="4" fill="#EF4444" class="group-hover:fill-red-600 transition-colors"/>
					<path d="M20 14L24 20L20 26L16 20L20 14Z" fill="white"/>
				</svg>
				<span class="text-xl font-bold">
					<span class="text-gray-900 dark:text-white">Wat</span>
					<span class="text-red-500">sch</span>
				</span>
			</a>
			<!-- Desktop Navigation -->
			<nav class="flex items-center space-x-1">
				{#each navItems as item}
					<a
						href={item.url}
						class={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${
							currentPath === item.url
								? 'text-red-500'
								: 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
						} ${item.key === 'navigation.saved' && pulseSaved ? 'saved-pulse' : ''}`}
					>
						{#if item.key === 'navigation.saved' && pulseSaved}
							<div class="relative">
								<svelte:component this={item.icon} class="w-4 h-4" />
								<span class="absolute -top-1 -right-1 flex h-3 w-3">
									<span
										class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"
									/>
									<span class="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
								</span>
							</div>
						{:else}
							<svelte:component this={item.icon} class="w-4 h-4" />
						{/if}
						<span class="text-xs mt-1">{$i18nStore.t(item.key)}</span>
					</a>
				{/each}
			</nav>
			<!-- Theme toggle, Login/Logout, LanguageSwitcher -->
			<div class="flex items-center gap-2">
				<button
					on:click={toggleTheme}
					class="p-2 rounded-full transition-all bg-gray-200 hover:bg-gray-300 dark:bg-black dark:hover:bg-gray-950 text-gray-700 dark:text-white/70 dark:hover:text-white"
					aria-label="Toggle theme"
				>
					{#if $theme === 'dark'}
						<Sun class="w-4 h-4" />
					{:else}
						<Moon class="w-4 h-4" />
					{/if}
				</button>

				{#if $isAuthenticated}
					<button
						on:click={handleLogout}
						class="px-3 py-1 rounded-full text-sm font-medium transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-black dark:hover:bg-gray-950 text-gray-700 dark:text-white/70 dark:hover:text-white"
					>
						{$i18nStore.t('login.logout', 'Logout')}
					</button>
				{:else}
					<a
						href="/login"
						class="rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 sm:inline-block"
					>
						{$i18nStore.t('login.sign_in', 'Sign In')}
					</a>
				{/if}
				<!-- Language Switcher elegantly spaced -->
				<div class="ml-2">
					<LanguageSwitcher />
				</div>
			</div>
		</div>
	</header>
</div>
<!-- Mobile Navigation bar at bottom -->
<div class="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-black/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 z-50">
	<div class="flex items-center justify-around h-14">
		{#each navItems as item}
			<a
				href={item.url}
				class={`flex flex-col items-center p-2 ${
					currentPath === item.url ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'
				} ${item.key === 'navigation.saved' && pulseSaved ? 'saved-pulse' : ''}`}
			>
				<div class="relative">
					{#if item.key === 'navigation.saved' && pulseSaved}
						<div class="relative">
							<svelte:component this={item.icon} class="w-5 h-5" />
							<span class="absolute -top-1 -right-1 flex h-3 w-3">
								<span
									class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"
								/>
								<span class="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
							</span>
						</div>
					{:else}
						<svelte:component this={item.icon} class="w-5 h-5" />
					{/if}
				</div>
				<span class="text-xs mt-1">{$i18nStore.t(item.key)}</span>
			</a>
		{/each}
	</div>
</div>

<style>
	@keyframes savedPulse {
		0% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.25);
		}
		100% {
			transform: scale(1);
		}
	}

	.saved-pulse {
		animation: savedPulse 0.7s cubic-bezier(0.4, 0, 0.6, 1) 3;
	}
</style>
