<script lang="ts">
	import { cn } from '$lib/utils';
	import { ChevronRight } from 'lucide-svelte';
	import Button from './button.svelte';
	import TextEffect from '../motion-primitives/text-effect.svelte';
	import AnimatedGroup from '../motion-primitives/animated-group.svelte';

	export let title = 'Find Your Perfect Movie';
	export let subtitle = {
		regular: 'Discover and watch movies ',
		gradient: 'together with friends.'
	};
	export let description =
		'Get personalized recommendations and vote for your favorites. Join movie nights and share your experience with others.';
	export let ctaText = 'Watch Solo';
	export let secondaryCtaText = 'Create Movie Night';
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

<main class="overflow-hidden flex items-center justify-center py-24">
	<section class="w-full">
		<div class="relative">
			<div class="mx-auto max-w-5xl px-6">
				<div class="sm:mx-auto lg:mr-auto lg:mt-0 relative flex flex-col items-center justify-center">
					<!-- Gradient overlay behind content -->
					<div class="absolute inset-0 w-full h-full rounded-3xl shadow-2xl pointer-events-none bg-gradient-to-t from-black/70 via-black/30 to-transparent z-0"></div>
					<!-- Content above gradient -->
					<div class="relative flex flex-col items-center gap-8 z-10 py-12 px-6">
						<TextEffect
							preset="fade-in-blur"
							speedSegment={0.03}
							as="h1"
							class="max-w-2xl text-balance text-5xl font-medium text-white md:text-6xl"
							per={isMobile ? 'word' : 'character'}
						>
							{title}
						</TextEffect>
						<TextEffect
							per="line"
							preset="fade-in-blur"
							speedSegment={0.1}
							delay={0.5}
							as="p"
							class="max-w-2xl text-pretty text-lg text-gray-200 mt-6"
						>
							{description}
						</TextEffect>
						<div class="flex flex-col sm:flex-row items-center gap-4 mt-8">
							<Button
								href={ctaHref}
								size="lg"
								class="bg-red-600 hover:bg-red-700 rounded-lg px-5 text-base text-white"
							>
								<span class="text-nowrap">{ctaText}</span>
							</Button>
							<Button
								href={secondaryCtaHref}
								size="lg"
								variant="outline"
								class="h-10.5 rounded-lg border border-gray-300 dark:border-gray-700 px-5 text-base text-gray-800 dark:text-gray-200 bg-white dark:bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
							>
								<span class="text-nowrap">{secondaryCtaText}</span>
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</main>
