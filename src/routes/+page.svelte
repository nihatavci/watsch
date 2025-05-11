<script lang="ts">
	import HeroSection from '$lib/components/ui/hero-section.svelte';
	// Removed onMount, onDestroy, and reactRoot as they are now in the layout
</script>

<!-- Main hero content. Background is now handled by +layout.svelte -->
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
