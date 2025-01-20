<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
</script>

<div class="relative min-h-screen bg-[#0A0118]">
	<!-- Gradient background -->
	<div
		class="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(220,38,38,0.15),rgba(255,255,255,0))]"
	/>

	<!-- RetroGrid -->
	<div class="pointer-events-none fixed inset-0 overflow-hidden [perspective:200px]">
		<div class="absolute inset-0 [transform:rotateX(65deg)]">
			<div
				class="animate-grid [background-image:linear-gradient(to_right,rgba(220,38,38,0.1)_1px,transparent_0),linear-gradient(to_bottom,rgba(220,38,38,0.1)_1px,transparent_0)] [background-repeat:repeat] [background-size:50px_50px] [height:300vh] [inset:0%_0px] [margin-left:-200%] [transform-origin:100%_0_0] [width:600vw]"
			/>
		</div>
		<div class="absolute inset-0 bg-gradient-to-t from-[#0A0118] to-transparent to-90%" />
	</div>

	<!-- Content -->
	<div class="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-16">
		

		<div class="max-w-3xl mx-auto text-center space-y-8">
			<h1 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight">
				<span class="block mb-2">Discover and watch movies</span>
				<span class="text-red-500">together with friends.</span>
			</h1>
			<p class="text-base sm:text-lg md:text-xl text-white/60 max-w-2xl mx-auto">
				Get personalized recommendations and vote for your favorites. Join movie nights and share your
				experience with others.
			</p>
			<div class="flex flex-wrap justify-center gap-4 pt-4">
				<a
					href="/recommendations"
					class="group relative inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-gradient-to-br from-red-500 via-red-500 to-red-600 text-white font-medium text-lg hover:shadow-xl hover:shadow-red-500/20 transition-all duration-300 hover:-translate-y-0.5"
				>
					<span>Find Your Perfect Movie</span>
					<ArrowRight class="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
				</a>
			</div>
		</div>
	</div>
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
