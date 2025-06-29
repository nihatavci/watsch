<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../app.postcss';
	import { onMount, onDestroy } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import { initAuth, authStore } from '$lib/stores/auth';
	import Navbar from '$lib/components/ui/Navbar.svelte';
	import ToastContainer from '$lib/components/ui/ToastContainer.svelte';
	import DotPattern from '$lib/components/ui/dot-pattern.svelte';

	let reactRoot: any = null;
	let isAuthenticated = false;

	onMount(() => {
		// Initialize theme classes on document
		const unsubscribeTheme = theme.subscribe((value) => {
			if (typeof document !== 'undefined') {
				// Apply color mode
				document.documentElement.classList.toggle('dark', value.colorMode === 'dark');
				
				// Always apply neobrutalism theme
				document.documentElement.classList.add('neobrutalism-theme');
			}
		});

		// Initialize authentication state
		initAuth();
		
		// Subscribe to auth state for components that need it
		const unsubscribeAuth = authStore.subscribe(state => {
			isAuthenticated = state.isAuthenticated;
			console.log('Auth state updated:', isAuthenticated ? 'Authenticated' : 'Not authenticated');
		});

		return () => {
			unsubscribeTheme();
			unsubscribeAuth();
		};
	});
</script>

<!-- DotPattern background absolutely positioned -->
<div class="absolute inset-0 h-full min-h-screen z-0 pointer-events-none">
	<DotPattern class="fixed inset-0 h-screen w-screen" />
</div>

<div
	class="relative min-h-screen bg-transparent text-gray-900 dark:text-white transition-colors duration-100"
>
	<Navbar />
	<ToastContainer />
	<div class="min-h-screen overflow-y-auto pt-12 pb-20 md:pb-4">
		<main class="relative z-10 px-4 sm:px-6 lg:px-8">
			<slot />
		</main>
	</div>
</div>

<style>
	:global(html) {
		transition: background-color 100ms ease;
	}

	:global(body) {
		transition: background-color 100ms ease, color 100ms ease;
	}

	:global(*) {
		transition-property: background-color, border-color, color, fill, stroke;
		transition-timing-function: ease;
		transition-duration: 0.1s;
	}

	/* Apply consistent transitions when theme is changing */
	:global(.theme-transitioning *) {
		transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow,
			transform !important;
		transition-timing-function: ease !important;
		transition-duration: 0.1s !important;
	}
</style>
