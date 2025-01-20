<script lang="ts">
	import { goto } from '$app/navigation';
	import { Popcorn, HelpCircle } from 'lucide-svelte';

	let username = '';
	let roomCode = '';

	function handleStartParty() {
		if (!username) return;
		goto(`/room/create?username=${encodeURIComponent(username)}`);
	}

	function handleJoinParty() {
		if (!username || !roomCode) return;
		goto(`/room/${roomCode}?username=${encodeURIComponent(username)}`);
	}
</script>

<svelte:head>
	<title>Movie Night | Watsch</title>
</svelte:head>

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
	<div class="relative z-10 min-h-screen flex items-center justify-center px-4 py-16">
		<div class="w-full max-w-3xl mx-auto">
			<!-- Title with popcorn icon -->
			<div class="text-center space-y-4 mb-8">
				<div class="inline-flex items-center gap-3">
					<Popcorn class="w-10 h-10 text-red-500" />
					<h1 class="text-5xl sm:text-6xl font-bold text-white">Movie Night Fun!</h1>
				</div>
				<p class="text-xl text-white/60">Grab your snacks and join the movie party!</p>
				<a href="/help" class="inline-flex items-center gap-1.5 text-white/60 hover:text-white/80">
					<HelpCircle class="w-4 h-4" />
					How does this work? 🤔
				</a>
			</div>

			<!-- Form Card -->
			<div class="p-8 rounded-2xl border border-red-500/20 bg-black/40 backdrop-blur-sm">
				<h2 class="text-2xl font-bold text-white text-center mb-6">Join the Fun!</h2>
				<p class="text-white/60 text-center mb-8">Create a room or hop into an existing one</p>

				<div class="space-y-6">
					<!-- Movie Star Name Input -->
					<div class="space-y-2">
						<label for="username" class="block text-sm font-medium text-white/80">Your Movie Star Name ⭐</label>
						<input
							type="text"
							id="username"
							bind:value={username}
							placeholder="What should we call you?"
							class="w-full px-4 py-3 bg-black/40 border border-red-500/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-red-500/40 transition-colors"
						/>
					</div>

					<!-- Action Buttons -->
					<div class="grid grid-cols-1 gap-4">
						<button
							on:click={handleStartParty}
							class="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-medium hover:shadow-xl hover:shadow-red-500/20 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
							disabled={!username}
						>
							Start the Party! 🎉
						</button>
						<div class="grid grid-cols-[1fr,auto] gap-3">
							<input
								type="text"
								bind:value={roomCode}
								placeholder="Got a room code?"
								class="w-full px-4 py-3 bg-black/40 border border-red-500/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-red-500/40 transition-colors"
							/>
							<button
								on:click={handleJoinParty}
								class="px-6 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
								disabled={!username || !roomCode}
							>
								Join In! 🎬
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
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