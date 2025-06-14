<script lang="ts">
	import { cn } from '$lib/utils';
	import { ChevronRight } from 'lucide-svelte';
	import Button from './button.svelte';
	import TextEffect from '../motion-primitives/text-effect.svelte';
	import AnimatedGroup from '../motion-primitives/animated-group.svelte';
	import { i18nStore } from '$lib/i18n';

	export let title = $i18nStore.t('home.headline');
	export let subtitle = {
		regular: $i18nStore.t('home.subtitle_regular'),
		gradient: $i18nStore.t('home.subtitle_gradient')
	};
	export let description = $i18nStore.t('home.description');
	export let ctaText = $i18nStore.t('home.cta_solo');
	export let secondaryCtaText = $i18nStore.t('home.cta_group');
	export let ctaHref = '/recommendations';
	export let secondaryCtaHref = '/movie-night';
	export let className = '';

	const transitionVariants = {
		item: {
			hidden: {
				opacity: 0,
				filter: 'blur(12px)',
				y: 12
			},
			visible: {
				opacity: 1,
				filter: 'blur(0px)',
				y: 0,
				transition: {
					type: 'spring',
					bounce: 0.3,
					duration: 1.5
				}
			}
		}
	};

	let isMobile = false;
	if (typeof window !== 'undefined') {
		isMobile = window.innerWidth < 640;
		window.addEventListener('resize', () => {
			isMobile = window.innerWidth < 640;
		});
	}
</script>

<main class="overflow-hidden">
	<section>
		<div class="relative pt-24">
			<div class="mx-auto max-w-5xl px-6">
				<div class="sm:mx-auto lg:mr-auto lg:mt-0">
					<TextEffect
						preset="fade-in-blur"
						speedSegment={0.03}
						as="h1"
						class="mt-8 max-w-2xl text-balance text-5xl font-medium text-gray-900 dark:text-white md:text-6xl lg:mt-16"
						per={isMobile ? 'word' : 'character'}
					>
						{@html title}
					</TextEffect>
					<TextEffect
						per="line"
						preset="fade-in-blur"
						speedSegment={0.1}
						delay={0.5}
						as="p"
						class="mt-8 max-w-2xl text-pretty text-lg text-gray-600 dark:text-gray-300"
					>
						{description}
					</TextEffect>

					<AnimatedGroup
						variants={{
							container: {
								hidden: { opacity: 0 },
								visible: {
									opacity: 1,
									transition: {
										staggerChildren: 0.05,
										delayChildren: 0.75
									}
								}
							},
							...transitionVariants
						}}
						class="mt-12 flex items-center gap-2"
					>
						<div class="rounded-[calc(var(--radius)+0.125rem)] border border-red-500/20 p-0.5">
							<Button
								href={ctaHref}
								size="lg"
								class="bg-red-600 hover:bg-red-700 rounded-lg px-5 text-base text-white"
							>
								<span class="text-nowrap">{ctaText}</span>
							</Button>
						</div>
						<Button
							href={secondaryCtaHref}
							size="lg"
							variant="outline"
							class="h-10.5 rounded-lg border-gray-300 dark:border-gray-700 px-5 text-base text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
						>
							<span class="text-nowrap">{secondaryCtaText}</span>
						</Button>
					</AnimatedGroup>
				</div>
			</div>
		</div>
	</section>
</main>
