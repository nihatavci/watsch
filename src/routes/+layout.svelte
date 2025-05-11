<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../app.postcss';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import Navbar from '$lib/components/ui/Navbar.svelte';
	import ToastContainer from '$lib/components/ui/ToastContainer.svelte';

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

<div
	class="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-300"
>
	<Navbar />
	<ToastContainer />
	<div class="min-h-screen overflow-y-auto pb-20 md:pb-16">
		<main class="relative z-10">
			<slot />
		</main>
	</div>
</div>

<style>
	:global(html) {
		transition: background-color 300ms ease-in-out;
	}

	:global(body) {
		transition: background-color 300ms ease-in-out, color 300ms ease-in-out;
	}

	:global(*) {
		transition-property: background-color, border-color, color, fill, stroke;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		transition-duration: 300ms;
	}

	/* Apply consistent transitions when theme is changing */
	:global(.theme-transitioning *) {
		transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow,
			transform !important;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1) !important;
		transition-duration: 300ms !important;
	}
</style>
