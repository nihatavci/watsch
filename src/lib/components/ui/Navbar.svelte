<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Home, Star, Bookmark, Moon, Sun, Film, Settings, User, LogOut } from 'lucide-svelte';
	import { theme, toggleColorMode } from '$lib/stores/theme';
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
		{ key: 'navigation.movie_night', url: '/movie-night', icon: Film },
		{ key: 'navigation.saved', url: '/saved', icon: Bookmark }
	];

	// Mobile-specific items that appear in overflow menu
	const mobileMenuItems = [
		{ key: 'navigation.settings', url: '/settings', icon: Settings },
	];

	let currentPath: string;
	let pulseSaved = false;
	let showMobileMenu = false;

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
			showMobileMenu = false;
			goto('/');
		}
	}

	function toggleMobileMenu() {
		showMobileMenu = !showMobileMenu;
	}

	function closeMobileMenu() {
		showMobileMenu = false;
	}
</script>

<div class="hidden md:block">
	<header class="z-50 bg-card border-b-2 border-border shadow-[0px_4px_0px_0px_hsl(var(--border))] fixed inset-x-0 top-0">
		<div class="flex h-12 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
			<!-- Logo -->
			<a href="/" class="flex items-center gap-2 group">
				<svg class="h-6 w-6" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
					<rect x="8" y="8" width="24" height="24" rx="4" fill="#EF4444" class="group-hover:fill-red-600 transition-colors"/>
					<path d="M20 14L24 20L20 26L16 20L20 14Z" fill="white"/>
				</svg>
				<span class="text-lg font-bold">
					<span class="text-foreground">Wat</span>
					<span class="text-destructive">sch</span>
				</span>
			</a>
			<!-- Desktop Navigation -->
			<nav class="flex items-center space-x-1">
				{#each navItems as item}
					<a
						href={item.url}
						class={`px-2 py-1.5 text-sm font-medium flex items-center gap-1 transition-all duration-100 border-2 border-transparent ${
							currentPath === item.url
								? 'text-destructive border-border bg-card shadow-[2px_2px_0px_0px_hsl(var(--border))]'
								: 'text-foreground hover:border-border hover:bg-accent hover:text-accent-foreground hover:shadow-[2px_2px_0px_0px_hsl(var(--border))]'
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
						<span class="text-xs">{$i18nStore.t(item.key)}</span>
					</a>
				{/each}
			</nav>
			<!-- Theme toggle, Login/Logout, LanguageSwitcher -->
			<div class="flex items-center gap-1.5">
				<!-- Color Mode Toggle -->
				<button
					on:click={toggleColorMode}
					class="p-1.5 transition-all duration-100 bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[4px_4px_0px_0px_hsl(var(--border))] hover:translate-x-[-2px] hover:translate-y-[-2px]"
					aria-label="Toggle color mode"
				>
					{#if $theme.colorMode === 'dark'}
						<Sun class="w-4 h-4" />
					{:else}
						<Moon class="w-4 h-4" />
					{/if}
				</button>

				{#if $isAuthenticated}
					<button
						on:click={handleLogout}
						class="px-2 py-1 text-sm font-medium transition-all duration-100 bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[4px_4px_0px_0px_hsl(var(--border))] hover:translate-x-[-2px] hover:translate-y-[-2px]"
					>
						{$i18nStore.t('login.logout', 'Logout')}
					</button>
				{:else}
					<a
						href="/login"
						class="px-3 py-1 text-sm font-medium transition-all duration-100 bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[4px_4px_0px_0px_hsl(var(--border))] hover:translate-x-[-2px] hover:translate-y-[-2px]"
					>
						{$i18nStore.t('login.sign_in', 'Sign In')}
					</a>
				{/if}
				<!-- Language Switcher elegantly spaced -->
				<div class="ml-1">
					<LanguageSwitcher />
				</div>
			</div>
		</div>
	</header>
</div>

<!-- Mobile Navigation bar at bottom -->
<div class="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t-2 border-border shadow-[0px_-4px_0px_0px_hsl(var(--border))] z-50">
	<div class="flex items-center justify-around h-16 px-2">
		{#each navItems as item}
			<a
				href={item.url}
				class={`flex items-center justify-center h-12 w-12 transition-all duration-100 border-2 border-transparent ${
					currentPath === item.url ? 'text-destructive border-border bg-accent/20 shadow-[2px_2px_0px_0px_hsl(var(--border))]' : 'text-foreground hover:border-border hover:bg-accent hover:text-accent-foreground hover:shadow-[2px_2px_0px_0px_hsl(var(--border))]'
				} ${item.key === 'navigation.saved' && pulseSaved ? 'saved-pulse' : ''}`}
			>
				<div class="relative">
					{#if item.key === 'navigation.saved' && pulseSaved}
						<div class="relative">
							<svelte:component this={item.icon} class="w-6 h-6" />
							<span class="absolute -top-1 -right-1 flex h-3 w-3">
								<span
									class="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"
								/>
								<span class="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
							</span>
						</div>
					{:else}
						<svelte:component this={item.icon} class="w-6 h-6" />
					{/if}
				</div>
			</a>
		{/each}
		
		<!-- Mobile Menu Button with proper icon -->
		<button
			on:click={toggleMobileMenu}
			class={`flex items-center justify-center h-12 w-12 transition-all duration-100 border-2 border-transparent ${
				showMobileMenu ? 'text-destructive border-border bg-accent/20 shadow-[2px_2px_0px_0px_hsl(var(--border))]' : 'text-foreground hover:border-border hover:bg-accent hover:text-accent-foreground hover:shadow-[2px_2px_0px_0px_hsl(var(--border))]'
			}`}
		>
			{#if showMobileMenu}
				<!-- X icon when menu is open -->
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
				</svg>
			{:else}
				<!-- Hamburger menu icon when closed -->
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
				</svg>
			{/if}
		</button>
	</div>
</div>

<!-- Mobile Menu Overlay -->
{#if showMobileMenu}
	<!-- Backdrop -->
	<div 
		class="md:hidden fixed inset-0 bg-black/50 z-40" 
		on:click={closeMobileMenu}
		on:keydown={closeMobileMenu}
		role="button"
		tabindex="0"
	></div>
	
	<!-- Menu Panel -->
	<div class="md:hidden fixed bottom-16 right-4 left-4 bg-card text-foreground border-2 border-border shadow-[8px_8px_0px_0px_hsl(var(--border))] z-50 overflow-hidden max-h-[70vh] overflow-y-auto">
		<div class="p-6">
			<!-- User Status -->
			<div class="mb-6 pb-6 border-b-2 border-border">
				{#if $isAuthenticated}
					<div class="flex items-center gap-4">
						<div class="w-12 h-12 bg-accent text-accent-foreground border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] flex items-center justify-center">
							<User class="w-6 h-6" />
						</div>
						<div>
							<p class="font-bold text-foreground">Signed In</p>
							<p class="text-sm text-muted-foreground">Welcome back!</p>
						</div>
					</div>
				{:else}
					<div class="text-center">
						<p class="text-muted-foreground mb-4">Not signed in</p>
						<a
							href="/login"
							on:click={closeMobileMenu}
							class="btn-destructive btn-md w-full"
						>
							Sign In
						</a>
					</div>
				{/if}
			</div>
			
			<!-- Color Mode Toggle Section -->
			<div class="mb-6 pb-6 border-b-2 border-border">
				<button
					on:click={() => { toggleColorMode(); closeMobileMenu(); }}
					class="btn-ghost btn-md w-full justify-start gap-3"
				>
					{#if $theme.colorMode === 'dark'}
						<Sun class="w-5 h-5" />
						<span>Light Mode</span>
					{:else}
						<Moon class="w-5 h-5" />
						<span>Dark Mode</span>
					{/if}
				</button>
			</div>
			
			<!-- Menu Items -->
			<div class="space-y-3">
				{#each mobileMenuItems as item}
					<a
						href={item.url}
						on:click={closeMobileMenu}
						class="btn-ghost btn-md w-full justify-start gap-3"
					>
						<svelte:component this={item.icon} class="w-5 h-5" />
						<span>{$i18nStore.t(item.key)}</span>
					</a>
				{/each}
				
				<!-- Logout Button -->
				{#if $isAuthenticated}
					<button
						on:click={handleLogout}
						class="btn-ghost btn-md w-full justify-start gap-3 text-destructive hover:bg-destructive hover:text-destructive-foreground"
					>
						<LogOut class="w-5 h-5" />
						<span>Sign Out</span>
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

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
