<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../app.postcss';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import { Home, Film, Star, Settings, LogOut, Bookmark, Video } from 'lucide-svelte';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import TubelightNavbar from '$lib/components/ui/tubelight-navbar.svelte';

	const navItems = [
		{
			name: 'Home',
			url: '/',
			icon: Home
		},
		{
			name: 'Shorts',
			url: '/shorts',
			icon: Video
		},
		{
			name: 'Movie Night',
			url: '/movie-night',
			icon: Film
		},
		{
			name: 'Recommendations',
			url: '/recommendations',
			icon: Star
		},
		{
			name: 'Saved',
			url: '/saved',
			icon: Bookmark
		},
		{
			name: 'Settings',
			url: '/settings',
			icon: Settings
		},
		{
			name: 'Logout',
			url: '/logout',
			icon: LogOut
		}
	];

	let open = false;

	onMount(() => {
		// Initialize theme class on document
		const unsubscribe = theme.subscribe((value) => {
			if (typeof document !== 'undefined') {
				document.documentElement.classList.toggle('dark', value === 'dark');
			}
		});

		return () => {
			unsubscribe();
		};
	});
</script>


<div class="h-screen overflow-hidden bg-background">
	<TubelightNavbar items={navItems} />

	<div class="h-screen overflow-y-auto pb-0 md:pb-0 md:pt-14">
		<main class="min-h-screen relative z-20">
			<slot />
		</main>
	</div>

	<div class="fixed bottom-20 left-3 z-[60] md:bottom-4">
		<ThemeToggle />
	</div>
</div>

<style>
	:global(html) {
		@apply bg-background;
	}
	:global(html.dark) {
		background-image: linear-gradient(to bottom right, rgba(30, 0, 60, 0.95), rgba(10, 1, 24, 0.97));
	}
	:global(body) {
		@apply m-0 p-0 antialiased;
	}
</style>
