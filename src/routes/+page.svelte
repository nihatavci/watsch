<script lang="ts">
	import HeroSection from '$lib/components/ui/hero-section.svelte';
	import { i18nStore } from '$lib/i18n';
	// Removed onMount, onDestroy, and reactRoot as they are now in the layout
</script>

<!-- Main hero content. Background is now handled by +layout.svelte -->
<div class="relative z-10">
<HeroSection
	title={$i18nStore.t('home.headline')}
	subtitle={{
		regular: $i18nStore.t('home.subtitle_regular'),
		gradient: $i18nStore.t('home.subtitle_gradient')
	}}
	description={$i18nStore.t('home.description')}
	ctaText={$i18nStore.t('home.cta_solo')}
	secondaryCtaText={$i18nStore.t('home.cta_group')}
	ctaHref="/recommendations"
	secondaryCtaHref="/movie-night"
	className="min-h-screen"
/>
</div>
