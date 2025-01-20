<script lang="ts">
	import { cn } from '$lib/utils';
	import { ChevronRight } from 'lucide-svelte';

	interface GridOptions {
		angle: number;
		cellSize: number;
		opacity: number;
		lightLineColor: string;
		darkLineColor: string;
	}

	interface $$Props {
		title?: string;
		subtitle?: {
			regular: string;
			gradient: string;
		};
		description?: string;
		ctaText?: string;
		ctaHref?: string;
		bottomImage?: {
			light: string;
			dark: string;
		};
		gridOptions?: GridOptions;
		className?: string;
	}

	export let title = 'Find Your Perfect Movie';
	export let subtitle = {
		regular: 'Discover and watch movies ',
		gradient: 'together with friends.'
	};
	export let description =
		'Get personalized recommendations and vote for your favorites. Join movie nights and share your experience with others.';
	export let ctaText = 'Watch Solo';
	export let ctaHref = '/movie-night';
	export let bottomImage: undefined | { light: string; dark: string } = undefined;
	export let gridOptions: GridOptions = {
		angle: 65,
		cellSize: 50,
		opacity: 0.15,
		lightLineColor: 'rgba(220,38,38,0.1)',
		darkLineColor: 'rgba(220,38,38,0.1)'
	};
	export let className = '';

	$: gridStyles = {
		'--grid-angle': `${gridOptions.angle}deg`,
		'--cell-size': `${gridOptions.cellSize}px`,
		'--opacity': gridOptions.opacity,
		'--light-line': gridOptions.lightLineColor,
		'--dark-line': gridOptions.darkLineColor
	};
</script>

<div class={cn('relative min-h-screen bg-white dark:bg-[#0A0118]', className)} {...$$restProps}>
	<!-- Gradient background -->
	<div
		class="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(220,38,38,0.05),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(220,38,38,0.15),rgba(255,255,255,0))]"
	/>

	<section class="relative mx-auto">
		<!-- RetroGrid -->
		<div
			class={cn('pointer-events-none absolute inset-0 overflow-hidden [perspective:200px]')}
			style={Object.entries(gridStyles)
				.map(([key, value]) => `${key}: ${value}`)
				.join(';')}
		>
			<div class="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
				<div
					class="animate-grid [background-image:linear-gradient(to_right,var(--light-line)_1px,transparent_0),linear-gradient(to_bottom,var(--light-line)_1px,transparent_0)] [background-repeat:repeat] [background-size:var(--cell-size)_var(--cell-size)] [height:300vh] [inset:0%_0px] [margin-left:-200%] [transform-origin:100%_0_0] [width:600vw]"
				/>
			</div>
			<div
				class="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0A0118] to-transparent to-90%"
			/>
		</div>

		<div class="relative z-10 mx-auto px-4 py-28 md:px-8">
			<div class="space-y-6 max-w-3xl mx-auto text-center">
				<!-- Small title with chevron -->
				<div
					class="inline-flex items-center px-4 py-1.5 rounded-full text-sm text-gray-600 dark:text-white/60 border border-red-500/10 dark:border-red-500/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm"
				>
					{title}
					<ChevronRight class="w-4 h-4 ml-1 opacity-60" />
				</div>

				<!-- Main heading -->
				<h2 class="text-4xl md:text-6xl font-medium tracking-tight text-gray-900 dark:text-white">
					{subtitle.regular}
					<span
						class="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-red-500"
					>
						{subtitle.gradient}
					</span>
				</h2>

				<!-- Description -->
				<p class="text-lg text-gray-600 dark:text-white/60 max-w-2xl mx-auto">
					{description}
				</p>

				<!-- CTA Button -->
				<div class="mt-8">
					<a
						href={ctaHref}
						class="inline-flex items-center px-6 py-3 rounded-full text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 transition-all duration-200 shadow-lg shadow-red-500/25"
					>
						{ctaText}
					</a>
				</div>
			</div>

			{#if bottomImage}
				<div class="mt-20 relative z-10 rounded-lg overflow-hidden border border-red-500/20">
					<img
						src={bottomImage.dark}
						class="w-full shadow-2xl"
						alt="Dashboard preview"
					/>
				</div>
			{/if}
		</div>
	</section>
</div>

<style>
	@keyframes grid {
		to {
			transform: translateY(-50%);
		}
	}

	:global(.animate-grid) {
		animation: grid 30s linear infinite;
	}
</style> 