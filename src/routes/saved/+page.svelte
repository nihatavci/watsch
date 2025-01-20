<script lang="ts">
	import { Bookmark, X, Sparkles } from 'lucide-svelte';
	import { library } from '../../stores/library';
	import { fade } from 'svelte/transition';

	$: savedMovies = $library.saved;
</script>

<div class="relative min-h-screen bg-[#0A0118]">
	<!-- Gradient background -->
	<div class="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(220,38,38,0.15),rgba(255,255,255,0))]" />

	<!-- RetroGrid -->
	<div class="pointer-events-none fixed inset-0 overflow-hidden [perspective:200px]">
		<div class="absolute inset-0 [transform:rotateX(65deg)]">
			<div class="animate-grid [background-image:linear-gradient(to_right,rgba(220,38,38,0.1)_1px,transparent_0),linear-gradient(to_bottom,rgba(220,38,38,0.1)_1px,transparent_0)] [background-repeat:repeat] [background-size:50px_50px] [height:300vh] [inset:0%_0px] [margin-left:-200%] [transform-origin:100%_0_0] [width:600vw]" />
		</div>
		<div class="absolute inset-0 bg-gradient-to-t from-[#0A0118] to-transparent to-90%" />
	</div>

	<!-- Content -->
	<div class="relative z-10 max-w-4xl mx-auto px-4 py-6">
		<!-- Mobile-optimized header -->
		<div class="space-y-3 sm:space-y-4">
			<div class="flex items-center gap-2 text-red-500">
				<Bookmark class="w-5 h-5" />
				<span class="text-sm font-medium">Your Collection</span>
			</div>
			<h1 class="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-white to-red-500 animate-gradient">
				Saved Movies & Shows
			</h1>
		</div>

		{#if savedMovies.length === 0}
			<div class="mt-6 p-6 rounded-xl bg-black/40 border border-red-500/20 backdrop-blur-sm text-center">
				<Sparkles class="w-6 h-6 text-red-500 mx-auto mb-2" />
				<p class="text-white/60">Start saving movies and shows you want to watch later!</p>
				<p class="text-xs text-white/40 mt-2">Tap the bookmark icon on any movie to save it here</p>
			</div>
		{:else}
			<div class="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
				{#each savedMovies as movie}
					<div
						in:fade
						class="group relative aspect-[2/3] rounded-xl overflow-hidden border border-red-500/20 bg-black/40 backdrop-blur-sm"
					>
						<img
							src={movie.poster ? movie.poster : '/placeholder.png'}
							alt={movie.title}
							class="w-full h-full object-cover"
						/>
						<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
							<div class="absolute inset-x-0 bottom-0 p-4">
								<h3 class="text-sm sm:text-base font-medium text-white mb-1 line-clamp-2">{movie.title}</h3>
								<p class="text-xs sm:text-sm text-white/60 mb-3">{movie.year}</p>
								<button
									class="w-full px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-sm flex items-center justify-center gap-2"
									on:click={() => library.removeFromSaved(movie.id)}
								>
									<X class="w-4 h-4" />
									<span>Remove</span>
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
			<!-- Mobile helper text -->
			<p class="text-xs text-white/40 text-center mt-4 sm:hidden">
				Tap and hold to see movie details
			</p>
		{/if}
	</div>
</div>

<style>
	@keyframes gradient {
		0% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
		100% { background-position: 0% 50%; }
	}
	.animate-gradient {
		background-size: 200% auto;
		animation: gradient 8s linear infinite;
	}
</style> 