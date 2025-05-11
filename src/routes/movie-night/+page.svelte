<script lang="ts">
	import { goto } from '$app/navigation';
	import { Popcorn, HelpCircle, Loader2 } from 'lucide-svelte';
	import { writable } from 'svelte/store';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let username = '';
	let roomCode = '';
	let isCreatingRoom = false;
	let isJoiningRoom = false;
	let error = '';

	// Define proper type for the room
	interface Room {
		code: string;
		hostId: string;
	}

	onMount(() => {
		// Check for existing username in localStorage
		const savedUsername = localStorage.getItem('movie_night_username');
		if (savedUsername) {
			username = savedUsername;
		}

		// Check if there's an error in URL query params
		const errorParam = $page.url.searchParams.get('error');
		if (errorParam) {
			error = decodeURIComponent(errorParam);
		}
	});

	async function handleStartParty() {
		if (!username) return;

		try {
			isCreatingRoom = true;
			error = '';

			// Save username to localStorage
			localStorage.setItem('movie_night_username', username);

			// Create the room via API
			const response = await fetch('/api/movie-night/create-room', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					hostNickname: username
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error?.message || 'Failed to create room');
			}

			const roomData = await response.json();
			console.log('Room created successfully:', roomData);

			if (!roomData || !roomData.roomCode) {
				throw new Error('Invalid response from server');
			}

			// Save room data to localStorage
			localStorage.setItem('movie_night_room', roomData.roomCode);
			localStorage.setItem('movie_night_host_id', roomData.hostId);

			// Navigate to the room page with a properly formed URL
			goto(`/movie-night/${roomData.roomCode}`);
		} catch (err) {
			console.error('Error creating room:', err);
			error = err instanceof Error ? err.message : 'Failed to create room';
		} finally {
			isCreatingRoom = false;
		}
	}

	async function handleJoinParty() {
		if (!username || !roomCode) return;

		try {
			isJoiningRoom = true;
			error = '';

			// Save username to localStorage
			localStorage.setItem('movie_night_username', username);

			// Check if room exists
			const response = await fetch(`/api/movie-night/room-status?code=${roomCode}`);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error?.message || 'Room not found');
			}

			// Navigate to the room page with a properly formed URL
			goto(`/movie-night/${roomCode}`);
		} catch (err) {
			console.error('Error joining room:', err);
			error = err instanceof Error ? err.message : 'Failed to join room';
		} finally {
			isJoiningRoom = false;
		}
	}
</script>

<svelte:head>
	<title>Movie Night | Watsch</title>
	<meta
		name="description"
		content="Create a movie night party with friends, vote on what to watch, and enjoy together!"
	/>
</svelte:head>

<div class="relative min-h-screen bg-white dark:bg-black">
	<!-- RetroGrid (only visible in dark mode) -->
	<div
		class="pointer-events-none fixed inset-0 overflow-hidden hidden dark:block [perspective:200px]"
	>
		<div class="absolute inset-0 [transform:rotateX(65deg)]">
			<div
				class="animate-grid [background-image:linear-gradient(to_right,rgba(220,38,38,0.1)_1px,transparent_0),linear-gradient(to_bottom,rgba(220,38,38,0.1)_1px,transparent_0)] [background-repeat:repeat] [background-size:50px_50px] [height:300vh] [inset:0%_0px] [margin-left:-200%] [transform-origin:100%_0_0] [width:600vw]"
			/>
		</div>
	</div>

	<!-- Content -->
	<div class="relative z-10 min-h-screen flex items-center justify-center px-4 py-16">
		<div class="w-full max-w-3xl mx-auto">
			<!-- Title with popcorn icon -->
			<div class="text-center space-y-4 mb-8">
				<div class="inline-flex items-center gap-3">
					<Popcorn class="w-10 h-10 text-red-500" />
					<h1 class="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white">Movie Night</h1>
				</div>
				<p class="text-xl text-gray-600 dark:text-gray-300">Watch movies together with friends!</p>
			</div>

			<!-- Form Card -->
			<div
				class="p-8 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-lg"
			>
				<h2 class="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">
					Join the Fun!
				</h2>
				<p class="text-gray-600 dark:text-gray-300 text-center mb-6">
					Create a room or join an existing one
				</p>

				{#if error}
					<div
						class="mb-6 p-4 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm font-medium"
					>
						❌ {error}
					</div>
				{/if}

				<div class="space-y-6">
					<!-- Username Input -->
					<div class="space-y-2">
						<label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>Your Nickname</label
						>
						<input
							type="text"
							id="username"
							bind:value={username}
							placeholder="What should we call you?"
							class="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
						/>
					</div>

					<!-- Action Buttons -->
					<div class="grid grid-cols-1 gap-4">
						<button
							on:click={handleStartParty}
							class="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm hover:shadow-lg hover:shadow-red-500/20 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
							disabled={!username || isCreatingRoom}
						>
							{#if isCreatingRoom}
								<div class="flex items-center justify-center">
									<Loader2 class="h-5 w-5 mr-2 animate-spin" />
									<span>Creating Room...</span>
								</div>
							{:else}
								Create a Movie Night 🎬
							{/if}
						</button>
						<div class="grid grid-cols-[1fr,auto] gap-3">
							<input
								type="text"
								bind:value={roomCode}
								placeholder="Got a room code?"
								class="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
							/>
							<button
								on:click={handleJoinParty}
								class="px-6 py-3 rounded-xl bg-white dark:bg-gray-800 text-red-600 dark:text-red-500 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
								disabled={!username || !roomCode || isJoiningRoom}
							>
								{#if isJoiningRoom}
									<Loader2 class="h-4 w-4 animate-spin" />
								{:else}
									Join Room
								{/if}
							</button>
						</div>
					</div>
				</div>
			</div>

			<!-- How it works section -->
			<div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
				<div
					class="p-4 rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800"
				>
					<div class="text-xl font-bold mb-2 text-red-500">1. Create a Room</div>
					<p class="text-gray-600 dark:text-gray-400">
						Enter your nickname and start a new movie night party.
					</p>
				</div>
				<div
					class="p-4 rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800"
				>
					<div class="text-xl font-bold mb-2 text-red-500">2. Invite Friends</div>
					<p class="text-gray-600 dark:text-gray-400">
						Share your room code with friends so they can join your movie night.
					</p>
				</div>
				<div
					class="p-4 rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800"
				>
					<div class="text-xl font-bold mb-2 text-red-500">3. Vote & Watch</div>
					<p class="text-gray-600 dark:text-gray-400">
						Everyone nominates movies, votes on the best one, and enjoys the winner!
					</p>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	@keyframes gradient {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}
	.animate-grid {
		background-size: 200% auto;
		animation: gradient 8s linear infinite;
	}
</style>
