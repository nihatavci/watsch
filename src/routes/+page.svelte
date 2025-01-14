<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/ui/button.svelte';
	import { Film, Users } from 'lucide-svelte';
</script>

<div class="min-h-screen flex flex-col items-center justify-center px-4 py-16">
	<div class="text-center max-w-2xl mx-auto mb-12">
		<h1 class="text-4xl sm:text-5xl font-bold text-white mb-4">Find Your Perfect Movie</h1>
		<p class="text-lg text-white/70">
			Discover and watch movies together with friends. Get personalized recommendations and vote for your favorites.
		</p>
	</div>

	<div class="flex flex-col sm:flex-row gap-4">
		<Button
			on:click={() => goto('/movie-night')}
			class="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg transition-colors backdrop-blur-sm flex items-center gap-3"
		>
			<Film size={24} />
			<div class="text-left">
				<div class="font-medium">Watch Solo</div>
				<div class="text-sm text-white/70">Get personalized recommendations</div>
			</div>
		</Button>

		<Button
			on:click={() => goto('/recommendations')}
			class="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg transition-colors backdrop-blur-sm flex items-center gap-3"
		>
			<Film size={24} />
			<div class="text-left">
				<div class="font-medium">Legacy Recommendations</div>
				<div class="text-sm text-white/70">Use the old recommendation flow</div>
			</div>
		</Button>
	</div>
</div>
