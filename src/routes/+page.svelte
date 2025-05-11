<script lang="ts">
	import HeroSection from '$lib/components/ui/hero-section.svelte';
	import { onMount, onDestroy } from 'svelte';

	let reactRoot: any = null;

	onMount(async () => {
		// Only run in browser
		if (typeof window !== 'undefined') {
			const React = (await import('react')).default;
			const ReactDOM = (await import('react-dom/client'));
			const { Waves } = await import('../components/ui/wave-background');
			const root = document.getElementById('react-waves-root');
			if (root) {
				// Remove any previous React root content
				root.innerHTML = '';
				reactRoot = ReactDOM.createRoot(root);
				reactRoot.render(React.createElement(Waves, { className: 'h-full w-full' }));
			}
		}
	});

	onDestroy(() => {
		if (reactRoot) {
			reactRoot.unmount();
			reactRoot = null;
		}
	});
</script>

<!-- Waves background absolutely positioned -->
<div class="absolute inset-0 h-full min-h-screen z-0 pointer-events-none">
	<div id="react-waves-root" class="h-full w-full min-h-screen"></div>
</div>

<!-- Main hero content above the background -->
<div class="relative z-10">
	<HeroSection
		title="Find Your Perfect Movie"
		subtitle={{
			regular: 'Discover and watch movies ',
			gradient: 'together with friends.'
		}}
		description="Get personalized recommendations and vote for your favorites. Join movie nights and share your experience with others."
		ctaText="Watch Solo"
		secondaryCtaText="Create Movie Night"
		ctaHref="/recommendations"
		secondaryCtaHref="/movie-night"
		className="min-h-screen"
	/>
</div>
