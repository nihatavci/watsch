<script lang="ts">
	import { goto } from '$app/navigation';
	import { Popcorn, HelpCircle } from 'lucide-svelte';

	let username = '';
	let roomCode = '';
</script>

<div class="space-y-6 max-w-4xl mx-auto text-center">
	<!-- Title with popcorn icon -->
	<div class="flex items-center justify-center gap-2 mb-2">
		<Popcorn class="w-8 h-8 text-red-500" />
		<h1 class="text-4xl font-bold text-gray-900 dark:text-white">Movie Night Fun!</h1>
	</div>

	<!-- Subtitle -->
	<p class="text-lg text-gray-600 dark:text-white/60">Grab your snacks and join the movie party!</p>

	<!-- Help link -->
	<a
		href="/help"
		class="inline-flex items-center gap-1.5 text-gray-600 hover:text-gray-900 dark:text-white/60 dark:hover:text-white/80 text-sm"
	>
		<HelpCircle class="w-4 h-4" />
		How does this work? 🤔
	</a>

	<!-- Form Card -->
	<div
		class="mt-8 p-8 rounded-2xl border border-red-500/10 dark:border-red-500/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm"
	>
		<div class="space-y-6">
			<div class="space-y-4">
				<h2 class="text-2xl font-semibold text-gray-900 dark:text-white text-center">
					Join the Fun!
				</h2>
				<p class="text-gray-600 dark:text-white/60 text-center">
					Create a room or hop into an existing one
				</p>
			</div>

			<!-- Username input -->
			<div class="space-y-2">
				<div class="flex items-center gap-2">
					<label for="username" class="text-sm font-medium text-gray-700 dark:text-white/80"
						>Your Movie Star Name</label
					>
					<span class="text-red-500">*</span>
					<span class="text-yellow-500">⭐</span>
				</div>
				<input
					type="text"
					id="username"
					bind:value={username}
					placeholder="This is required to join the fun!"
					class="w-full px-4 py-2.5 bg-white dark:bg-black/40 border border-red-500/10 dark:border-red-500/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/50"
				/>
			</div>

			<!-- Action buttons -->
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<button
					class="w-full px-6 py-3 rounded-lg text-white font-medium bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 transition-all duration-200 shadow-lg shadow-red-500/25 flex items-center justify-center gap-2"
				>
					Start the Party! 🎉
				</button>

				<div class="flex items-center gap-3 w-full">
					<input
						type="text"
						bind:value={roomCode}
						placeholder="Got a room code?"
						class="flex-1 min-w-0 px-4 py-2.5 bg-white dark:bg-black/40 border border-red-500/10 dark:border-red-500/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/50"
					/>
					<button
						class="whitespace-nowrap px-6 py-2.5 rounded-lg text-gray-900 dark:text-white font-medium bg-red-500/10 hover:bg-red-500/20 transition-all duration-200 border border-red-500/10 dark:border-red-500/20"
					>
						Join In! 🎬
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
