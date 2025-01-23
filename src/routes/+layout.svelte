<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../app.postcss';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import { Home, Film, Star, Settings, LogOut, Bookmark } from 'lucide-svelte';
	import Sidebar from '$lib/components/ui/sidebar/index.svelte';
	import SidebarBody from '$lib/components/ui/sidebar/body.svelte';
	import SidebarLink from '$lib/components/ui/sidebar/link.svelte';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';

	const links = [
		{
			label: 'Home',
			href: '/',
			icon: Home
		},
		{
			label: 'Movie Night',
			href: '/movie-night',
			icon: Film
		},
		{
			label: 'Recommendations',
			href: '/recommendations',
			icon: Star
		},
		{
			label: 'Saved Movies',
			href: '/saved',
			icon: Bookmark
		},
		{
			label: 'Settings',
			href: '/settings',
			icon: Settings
		},
		{
			label: 'Logout',
			href: '/logout',
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
	<Sidebar bind:open>
		<SidebarBody>
			<div class="flex flex-col flex-1">
				<a href="/" class="flex items-center px-3 py-2 mb-6">
					<span class="text-sm font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200">
						Watsch
					</span>
				</a>
				<div class="flex flex-col gap-1">
					{#each links as link}
						<SidebarLink {link} />
					{/each}
				</div>
			</div>
			<div class="flex flex-col mt-auto pt-4">
				<div class="flex items-center gap-3 px-3 py-2">
					<div class="w-8 h-8 rounded-full bg-muted overflow-hidden flex-shrink-0">
						<img
							src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
							alt="Profile"
							class="w-full h-full object-cover"
						/>
					</div>
					<span class="text-[13px] text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200">
						Your Profile
					</span>
				</div>
			</div>
		</SidebarBody>
	</Sidebar>

	<div class="md:ml-[60px] h-screen overflow-y-auto">
		<main class="min-h-screen">
			<slot />
		</main>
	</div>
</div>

<div class="fixed bottom-4 left-3 z-[60] md:block hidden">
	<ThemeToggle />
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
  