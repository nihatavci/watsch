<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import {
		Loader2,
		Users,
		Film,
		ThumbsUp,
		ArrowLeft,
		Plus,
		Search,
		PlayCircle,
		PartyPopper,
		AlertCircle,
		Crown,
		Sparkles
	} from 'lucide-svelte';

	// Get the room code from the URL parameter
	const roomCode = $page.params.roomCode;

	let username = '';
	let isHost = false;
	let participantId = '';
	let roomStatus: any = null;
	let error = '';
	let loading = true;
	let joiningRoom = false;
	let startingNominations = false;
	let startingVoting = false;
	let finishingVoting = false;
	let searchQuery = '';
	let participantsList: Array<{ id: string; nickname: string }> = [];
	let refreshInterval: ReturnType<typeof setInterval>;

	// New variables for recommendations
	let showRecommendations = false;
	let recommendations: any[] = [];
	let loadingRecommendations = false;
	let searchResults: any[] = [];
	let loadingSearch = false;
	let searchTimeout: ReturnType<typeof setTimeout>;
	let selectedMovie: any = null;
	let nominatingMovie = false;

	// Helper function for handling keydown events
	function handleKeydown(movie: any, event: KeyboardEvent): void {
		if (event.key === 'Enter') {
			selectMovie(movie);
		}
	}

	onMount(() => {
		// Get username from localStorage
		username = localStorage.getItem('movie_night_username') || '';
		if (!username) {
			// Redirect to movie night page with error if no username
			goto('/movie-night?error=' + encodeURIComponent('Please enter a nickname first'));
			return;
		}

		// Check if user is the host
		const storedHostId = localStorage.getItem('movie_night_host_id');
		const storedRoomCode = localStorage.getItem('movie_night_room');
		participantId = storedHostId || '';

		if (storedRoomCode === roomCode && storedHostId) {
			isHost = true;
		}

		// Fetch room status and possibly join the room
		initRoom();

		// Setup auto-refresh for room status every 5 seconds
		refreshInterval = setInterval(fetchRoomStatus, 5000);

		// Cleanup on component unmount
		return () => {
			if (refreshInterval) clearInterval(refreshInterval);
		};
	});

	async function initRoom() {
		try {
			// First fetch room status
			await fetchRoomStatus();

			// If user is not the host and not already in the room, join the room
			if (!isHost && roomStatus && !isUserInRoom()) {
				await joinRoom();
			}
		} catch (err) {
			console.error('Error initializing room:', err);
		}
	}

	// Check if the current user is in the room
	function isUserInRoom() {
		if (!roomStatus || !roomStatus.participants) return false;

		// If user is host, check by host id
		if (isHost) {
			return roomStatus.participants.some(
				(p: { id: string; nickname: string }) =>
					p.id === localStorage.getItem('movie_night_host_id')
			);
		}

		// If user has a participant id from a previous join
		if (participantId) {
			return roomStatus.participants.some(
				(p: { id: string; nickname: string }) => p.id === participantId
			);
		}

		// Otherwise, check by nickname
		return roomStatus.participants.some(
			(p: { id: string; nickname: string }) => p.nickname.toLowerCase() === username.toLowerCase()
		);
	}

	// Host starts the nomination phase
	async function startNominations() {
		if (!isHost) return;

		try {
			startingNominations = true;

			const response = await fetch('/api/movie-night/start-nominations', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					roomCode
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error?.message || 'Failed to start nominations');
			}

			await fetchRoomStatus(); // Refresh room status after starting nominations
		} catch (err) {
			console.error('Error starting nominations:', err);
			error = err instanceof Error ? err.message : 'Failed to start nominations';
		} finally {
			startingNominations = false;
		}
	}

	// Host starts the voting phase
	async function startVoting() {
		if (!isHost) return;

		try {
			startingVoting = true;

			const response = await fetch('/api/movie-night/start-voting', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					roomCode
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error?.message || 'Failed to start voting');
			}

			await fetchRoomStatus(); // Refresh room status after starting voting
		} catch (err) {
			console.error('Error starting voting:', err);
			error = err instanceof Error ? err.message : 'Failed to start voting';
		} finally {
			startingVoting = false;
		}
	}

	// Host finishes the voting phase
	async function finishVoting() {
		if (!isHost) return;

		try {
			finishingVoting = true;

			const response = await fetch('/api/movie-night/finish-voting', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					roomCode
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error?.message || 'Failed to finish voting');
			}

			await fetchRoomStatus(); // Refresh room status after finishing voting
		} catch (err) {
			console.error('Error finishing voting:', err);
			error = err instanceof Error ? err.message : 'Failed to finish voting';
		} finally {
			finishingVoting = false;
		}
	}

	// Join the room as a new participant
	async function joinRoom() {
		try {
			joiningRoom = true;

			const response = await fetch('/api/movie-night/join-room', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					roomCode,
					nickname: username
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error?.message || 'Failed to join room');
			}

			const data = await response.json();

			// Store the participant ID
			participantId = data.participantId;
			localStorage.setItem('movie_night_participant_id', data.participantId);

			// Update room status with new data
			roomStatus = data;
			participantsList = data.participants || [];
		} catch (err) {
			console.error('Error joining room:', err);
			error = err instanceof Error ? err.message : 'Failed to join room';
		} finally {
			joiningRoom = false;
		}
	}

	async function fetchRoomStatus() {
		try {
			loading = true;
			// Add cache-busting parameter to avoid browser caching
			const response = await fetch(`/api/movie-night/room-status?code=${roomCode}&t=${Date.now()}`);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error?.message || 'Room not found');
			}

			const data = await response.json();
			roomStatus = data;

			// Extract participants into its own variable for easy access
			participantsList = data.participants || [];

			// Ensure loading is set to false after at least 500ms to avoid flickering
			setTimeout(() => {
				loading = false;
			}, 500);
		} catch (err) {
			console.error('Error fetching room status:', err);
			error = err instanceof Error ? err.message : 'Failed to load room';
			loading = false;

			// Only redirect on serious errors, not temporary connection issues
			if (err instanceof Error && !err.message.includes('Failed to fetch')) {
				// Redirect to movie night page with error
				goto('/movie-night?error=' + encodeURIComponent(error));
			}
		}
	}

	// Function to display a participant who just joined
	function getLatestParticipant() {
		if (participantsList.length <= 1) return null;
		const nonHostParticipants = isHost
			? participantsList.filter((p) => p.id !== localStorage.getItem('movie_night_host_id'))
			: participantsList;

		return nonHostParticipants[nonHostParticipants.length - 1];
	}

	// Get unique participant count
	$: uniqueParticipantCount = participantsList
		? new Set(participantsList.map((p) => p.id)).size
		: 0;

	// Get phase display name
	$: phaseDisplay =
		roomStatus?.phase === 'nominate'
			? 'Nominating Movies'
			: roomStatus?.phase === 'vote'
			? 'Voting Phase'
			: roomStatus?.phase === 'complete'
			? 'Results'
			: 'Waiting';

	// New functions for recommendation and search

	// Function to get movie recommendations
	async function getRecommendations() {
		try {
			loadingRecommendations = true;
			showRecommendations = true;

			// Get a mix of popular movies and TV shows
			const response = await fetch('/api/getRecommendation', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					query: 'movie, Action, Adventure, Comedy',
					mediaType: 'movie',
					genres: ['Action', 'Adventure', 'Comedy'],
					platforms: []
				})
			});

			if (!response.ok) {
				throw new Error('Failed to get recommendations');
			}

			recommendations = await response.json();
		} catch (err) {
			console.error('Error getting recommendations:', err);
			error = err instanceof Error ? err.message : 'Failed to get recommendations';
		} finally {
			loadingRecommendations = false;
		}
	}

	// Function to search for movies
	async function searchMovies() {
		// Clear previous timeout if exists
		if (searchTimeout) clearTimeout(searchTimeout);

		// If search query is empty, clear results
		if (!searchQuery.trim()) {
			searchResults = [];
			loadingSearch = false;
			return;
		}

		// Set a timeout to avoid making too many requests
		searchTimeout = setTimeout(async () => {
			try {
				loadingSearch = true;

				const response = await fetch(
					`/api/tmdb/search?title=${encodeURIComponent(searchQuery)}&type=movie`
				);

				if (!response.ok) {
					throw new Error('Failed to search movies');
				}

				const data = await response.json();
				searchResults = data.results || [];
			} catch (err) {
				console.error('Error searching movies:', err);
				error = err instanceof Error ? err.message : 'Failed to search movies';
			} finally {
				loadingSearch = false;
			}
		}, 500);
	}

	// Function to select a movie for nomination
	function selectMovie(movie: any) {
		selectedMovie = movie;
		showRecommendations = false;
	}

	// Function to nominate a movie
	async function nominateMovie() {
		if (!selectedMovie) return;

		try {
			nominatingMovie = true;

			const movieData = {
				id: selectedMovie.id,
				title: selectedMovie.title || selectedMovie.name,
				overview: selectedMovie.overview,
				poster_path: selectedMovie.poster_path
					? `https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}`
					: null,
				backdrop_path: selectedMovie.backdrop_path
					? `https://image.tmdb.org/t/p/original${selectedMovie.backdrop_path}`
					: null,
				release_date: selectedMovie.release_date || selectedMovie.first_air_date,
				vote_average: selectedMovie.vote_average,
				media_type: selectedMovie.media_type || 'movie'
			};

			const response = await fetch('/api/movie-night/nominate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					roomCode,
					nickname: username,
					movie: movieData
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error?.message || 'Failed to nominate movie');
			}

			// Clear selection and refresh room status
			selectedMovie = null;
			searchQuery = '';
			searchResults = [];
			await fetchRoomStatus();
		} catch (err) {
			console.error('Error nominating movie:', err);
			error = err instanceof Error ? err.message : 'Failed to nominate movie';
		} finally {
			nominatingMovie = false;
		}
	}

	// Watch searchQuery for changes
	$: if (searchQuery) {
		searchMovies();
	}
</script>

<svelte:head>
	<title>Movie Night: {roomCode} | Watsch</title>
	<meta
		name="description"
		content="Join this movie night room to vote and watch movies with friends"
	/>
</svelte:head>

<div
	class="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black pt-6"
>
	<div class="max-w-4xl mx-auto px-4">
		<!-- Back button -->
		<a
			href="/movie-night"
			class="inline-flex items-center py-2 px-4 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mb-6"
		>
			<ArrowLeft class="w-5 h-5 mr-2" />
			<span class="font-medium">Back to Movie Night</span>
		</a>

		{#if loading && !roomStatus}
			<div class="flex flex-col items-center justify-center py-20">
				<div
					class="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
				>
					<Loader2 class="w-12 h-12 text-red-500 animate-spin" />
				</div>
				<p class="text-gray-600 dark:text-gray-300 mt-6 text-lg">Loading room...</p>
			</div>
		{:else if joiningRoom}
			<div class="flex flex-col items-center justify-center py-20">
				<div
					class="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
				>
					<Loader2 class="w-12 h-12 text-blue-500 animate-spin" />
				</div>
				<p class="text-gray-600 dark:text-gray-300 mt-6 text-lg">Joining as {username}...</p>
			</div>
		{:else if error && !roomStatus}
			<div
				class="p-8 rounded-3xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-center shadow-lg"
			>
				<div
					class="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center mb-4"
				>
					<AlertCircle class="w-8 h-8 text-red-500" />
				</div>
				<p class="text-red-800 dark:text-red-300 font-medium text-lg mb-6">{error}</p>
				<a
					href="/movie-night"
					class="inline-block px-6 py-3 rounded-full bg-red-600 text-white font-medium hover:bg-red-700 transition-colors shadow-md hover:shadow-lg"
				>
					Return to Movie Night
				</a>
			</div>
		{:else if roomStatus}
			<div
				class="p-0 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden shadow-xl"
			>
				<!-- Header with room info and participants count -->
				<div
					class="px-6 md:px-8 pt-6 md:pt-8 pb-4 bg-gradient-to-r from-red-500 to-orange-500 text-white"
				>
					<div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
						<div>
							<h1 class="text-3xl font-bold">Movie Night</h1>
							<div class="flex items-center mt-2 space-x-2">
								<div
									class="px-3 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm text-sm font-medium"
								>
									Room: {roomCode}
								</div>
								<div
									class="px-3 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm text-sm font-medium"
								>
									{phaseDisplay}
								</div>
							</div>
						</div>
						<div
							class="flex items-center rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 space-x-2 self-start md:self-auto"
						>
							<Users class="w-5 h-5 text-white" />
							<span class="font-medium">
								{uniqueParticipantCount}
								{uniqueParticipantCount === 1 ? 'participant' : 'participants'}
							</span>
						</div>
					</div>
				</div>

				<!-- Latest joined participant notification -->
				{#if getLatestParticipant()}
					<div
						class="mx-6 md:mx-8 mt-4 p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 text-green-800 dark:text-green-300 flex items-center"
					>
						<div
							class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-800/50 flex items-center justify-center mr-3"
						>
							<Plus class="w-5 h-5 text-green-600 dark:text-green-300" />
						</div>
						<div>
							<span class="font-medium">{getLatestParticipant()?.nickname}</span>
							<span class="ml-1">just joined the party!</span>
						</div>
					</div>
				{/if}

				<!-- Main content container -->
				<div class="p-6 md:p-8 space-y-8">
					<!-- Room Phase Display -->
					<div
						class="p-6 rounded-3xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
					>
						<div class="flex items-start space-x-4">
							<div
								class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex-shrink-0 flex items-center justify-center"
							>
								{#if roomStatus.phase === 'nominate'}
									<Film class="w-6 h-6 text-red-500" />
								{:else if roomStatus.phase === 'vote'}
									<ThumbsUp class="w-6 h-6 text-red-500" />
								{:else if roomStatus.phase === 'complete'}
									<PartyPopper class="w-6 h-6 text-red-500" />
								{:else}
									<Users class="w-6 h-6 text-red-500" />
								{/if}
							</div>
							<div>
								<h2 class="text-xl font-bold text-gray-900 dark:text-white">{phaseDisplay}</h2>
								<p class="text-gray-600 dark:text-gray-300 mt-1">
									{#if roomStatus.phase === 'nominate'}
										Everyone is choosing movies they'd like to watch together. Add your suggestions!
									{:else if roomStatus.phase === 'vote'}
										Vote for your favorite movies from the nominations.
									{:else if roomStatus.phase === 'complete'}
										The winning movie has been selected! Get your popcorn ready.
									{:else}
										Waiting for the host to start the movie night.
									{/if}
								</p>
							</div>
						</div>
					</div>

					<!-- Participants List -->
					<div
						class="p-6 rounded-3xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
					>
						<h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
							<Users class="w-5 h-5 mr-2 text-red-500" />
							Participants
						</h2>
						{#if participantsList.length === 0}
							<div class="p-6 text-center rounded-2xl bg-gray-100 dark:bg-gray-700/50">
								<p class="text-gray-500 dark:text-gray-400">No participants have joined yet</p>
							</div>
						{:else}
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{#each participantsList as participant}
									<div
										class="flex items-center gap-3 p-4 rounded-2xl {participant.id ===
										localStorage.getItem('movie_night_host_id')
											? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/50'
											: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'} shadow-sm"
									>
										<div
											class="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-800 dark:text-red-200 font-bold text-lg"
										>
											{participant.nickname.charAt(0).toUpperCase()}
										</div>
										<div>
											<div class="text-gray-800 dark:text-gray-200 font-medium">
												{participant.nickname}
												{participant.id === participantId && !isHost ? ' (You)' : ''}
											</div>
											{#if participant.id === localStorage.getItem('movie_night_host_id')}
												<span
													class="inline-block mt-1 text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded-full"
													>Host</span
												>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Host controls -->
					{#if isHost}
						<div
							class="p-6 rounded-3xl border-2 border-yellow-300 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20"
						>
							<h2
								class="text-xl font-bold text-yellow-800 dark:text-yellow-300 mb-4 flex items-center"
							>
								<Crown class="w-5 h-5 mr-2" />
								Host Controls
							</h2>
							<p class="text-gray-600 dark:text-gray-300 mb-5">
								You're the host of this movie night. Use these controls to manage the progress.
							</p>

							<!-- Host action buttons based on phase -->
							<div class="flex flex-wrap gap-4">
								{#if !roomStatus.phase || roomStatus.phase === 'waiting'}
									<button
										on:click={startNominations}
										disabled={startingNominations}
										class="px-8 py-4 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:hover:transform-none disabled:hover:shadow-lg flex items-center gap-2"
									>
										{#if startingNominations}
											<Loader2 class="w-6 h-6 animate-spin" />
											<span>Starting...</span>
										{:else}
											<Film class="w-6 h-6" />
											<span>Start Movie Nominations</span>
										{/if}
									</button>
								{:else if roomStatus.phase === 'nominate'}
									<button
										on:click={startVoting}
										disabled={startingVoting ||
											(roomStatus.nominations && roomStatus.nominations.length < 2)}
										class="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:hover:transform-none disabled:hover:shadow-lg flex items-center gap-2"
									>
										{#if startingVoting}
											<Loader2 class="w-6 h-6 animate-spin" />
											<span>Starting Voting...</span>
										{:else}
											<ThumbsUp class="w-6 h-6" />
											<span
												>Start Voting{roomStatus.nominations && roomStatus.nominations.length < 2
													? ' (Need more nominations)'
													: ''}</span
											>
										{/if}
									</button>
								{:else if roomStatus.phase === 'vote'}
									<button
										on:click={finishVoting}
										disabled={finishingVoting}
										class="px-8 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:hover:transform-none disabled:hover:shadow-lg flex items-center gap-2"
									>
										{#if finishingVoting}
											<Loader2 class="w-6 h-6 animate-spin" />
											<span>Finalizing Results...</span>
										{:else}
											<PartyPopper class="w-6 h-6" />
											<span>Finish Voting</span>
										{/if}
									</button>
								{/if}
							</div>
						</div>
					{/if}

					<!-- Feature Section: Nomination/Voting UI -->
					<div
						class="rounded-3xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 shadow-lg"
					>
						<div
							class="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
						>
							<h2 class="text-xl font-bold text-gray-900 dark:text-white">
								{#if roomStatus.phase === 'nominate'}
									Nominate Movies
								{:else if roomStatus.phase === 'vote'}
									Vote for Movies
								{:else if roomStatus.phase === 'complete'}
									Winner Announced!
								{:else}
									Movie Night Status
								{/if}
							</h2>
						</div>

						<div class="p-6">
							{#if loading && !error}
								<div class="flex justify-center py-8">
									<Loader2 class="w-10 h-10 text-red-500 animate-spin" />
								</div>
							{:else if roomStatus.phase === 'nominate'}
								<div class="space-y-6">
									<!-- Movie search and recommendations controls -->
									<div class="flex flex-col sm:flex-row gap-4">
										<div class="relative flex-grow">
											<div
												class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
											>
												<Search class="h-5 w-5 text-gray-400" />
											</div>
											<input
												type="text"
												bind:value={searchQuery}
												placeholder="Search for a movie to nominate..."
												class="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
											/>
										</div>

										<button
											on:click={getRecommendations}
											disabled={loadingRecommendations}
											class="px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
										>
											{#if loadingRecommendations}
												<Loader2 class="w-5 h-5 animate-spin" />
												<span>Loading...</span>
											{:else}
												<Sparkles class="w-5 h-5" />
												<span>Get Recommendations</span>
											{/if}
										</button>
									</div>

									<!-- Selected movie display -->
									{#if selectedMovie}
										<div
											class="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
										>
											<div class="flex flex-col md:flex-row gap-4">
												{#if selectedMovie.poster_path}
													<img
														src={`https://image.tmdb.org/t/p/w200${selectedMovie.poster_path}`}
														alt={selectedMovie.title || selectedMovie.name}
														class="w-32 h-48 rounded-lg object-cover flex-shrink-0 mx-auto md:mx-0"
													/>
												{:else}
													<div
														class="w-32 h-48 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 mx-auto md:mx-0"
													>
														<Film class="w-12 h-12 text-gray-400" />
													</div>
												{/if}

												<div class="flex-grow">
													<h3 class="text-xl font-bold text-gray-900 dark:text-white">
														{selectedMovie.title || selectedMovie.name}
														{#if selectedMovie.release_date || selectedMovie.first_air_date}
															<span class="text-gray-500 font-normal text-base ml-2">
																({new Date(
																	selectedMovie.release_date || selectedMovie.first_air_date
																).getFullYear()})
															</span>
														{/if}
													</h3>

													<p class="text-gray-700 dark:text-gray-300 mt-2 line-clamp-3">
														{selectedMovie.overview || 'No description available.'}
													</p>

													<div class="mt-4 flex items-center flex-wrap gap-2">
														<span
															class="inline-block px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-sm font-medium"
														>
															{selectedMovie.media_type === 'tv' ? 'TV Show' : 'Movie'}
														</span>

														{#if selectedMovie.vote_average}
															<span
																class="inline-block px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-sm font-medium"
															>
																★ {selectedMovie.vote_average.toFixed(1)}
															</span>
														{/if}
													</div>

													<div class="mt-4 flex gap-3">
														<button
															on:click={nominateMovie}
															disabled={nominatingMovie}
															class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
														>
															{#if nominatingMovie}
																<Loader2 class="w-4 h-4 animate-spin" />
																<span>Nominating...</span>
															{:else}
																<Plus class="w-4 h-4" />
																<span>Nominate This Movie</span>
															{/if}
														</button>

														<button
															on:click={() => (selectedMovie = null)}
															class="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium"
														>
															Cancel
														</button>
													</div>
												</div>
											</div>
										</div>
									{:else if showRecommendations}
										<!-- Recommendations display -->
										<div>
											<h3
												class="text-lg font-semibold mb-3 text-gray-800 dark:text-white flex items-center gap-2"
											>
												<Sparkles class="w-5 h-5 text-purple-500" />
												Recommended Movies
											</h3>

											{#if loadingRecommendations}
												<div class="flex justify-center py-6">
													<Loader2 class="w-8 h-8 text-purple-500 animate-spin" />
												</div>
											{:else if recommendations.length === 0}
												<p class="text-center py-4 text-gray-600 dark:text-gray-400">
													No recommendations found.
												</p>
											{:else}
												<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
													{#each recommendations as movie}
														<div
															on:click={() => selectMovie(movie)}
															on:keydown={(event: KeyboardEvent) => handleKeydown(movie, event)}
															class="cursor-pointer p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex flex-col"
															tabindex="0"
															role="button"
														>
															{#if movie.poster_path}
																<img
																	src={movie.poster_path}
																	alt={movie.title}
																	class="w-full h-48 object-cover rounded-lg mb-2"
																/>
															{:else}
																<div
																	class="w-full h-48 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-2"
																>
																	<Film class="w-12 h-12 text-gray-400" />
																</div>
															{/if}

															<h4 class="font-medium text-gray-900 dark:text-white line-clamp-1">
																{movie.title}
															</h4>

															<div class="mt-auto pt-2 flex items-center justify-between">
																<span class="text-sm text-gray-500 dark:text-gray-400">
																	{movie.year || 'N/A'}
																</span>

																{#if movie.rating}
																	<span
																		class="inline-block px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-xs font-medium"
																	>
																		★ {(movie.rating / 10).toFixed(1)}
																	</span>
																{/if}
															</div>
														</div>
													{/each}
												</div>
											{/if}
										</div>
									{:else if searchQuery && searchResults.length > 0}
										<!-- Search results display -->
										<div>
											<h3
												class="text-lg font-semibold mb-3 text-gray-800 dark:text-white flex items-center gap-2"
											>
												<Search class="w-5 h-5 text-gray-500" />
												Search Results
											</h3>

											<div class="space-y-3">
												{#each searchResults as movie}
													<div
														on:click={() => selectMovie(movie)}
														on:keydown={(event: KeyboardEvent) => handleKeydown(movie, event)}
														class="cursor-pointer p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-3"
														tabindex="0"
														role="button"
													>
														{#if movie.poster_path}
															<img
																src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
																alt={movie.title || movie.name}
																class="w-12 h-18 object-cover rounded-md"
															/>
														{:else}
															<div
																class="w-12 h-18 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
															>
																<Film class="w-6 h-6 text-gray-400" />
															</div>
														{/if}

														<div>
															<h4 class="font-medium text-gray-900 dark:text-white">
																{movie.title || movie.name}
															</h4>

															<div class="flex items-center gap-2 mt-1">
																{#if movie.release_date || movie.first_air_date}
																	<span class="text-sm text-gray-500 dark:text-gray-400">
																		{new Date(
																			movie.release_date || movie.first_air_date
																		).getFullYear()}
																	</span>
																{/if}

																{#if movie.vote_average}
																	<span
																		class="inline-block px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-xs font-medium"
																	>
																		★ {movie.vote_average.toFixed(1)}
																	</span>
																{/if}

																<span
																	class="inline-block px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium"
																>
																	{movie.media_type === 'tv' ? 'TV Show' : 'Movie'}
																</span>
															</div>
														</div>
													</div>
												{/each}
											</div>
										</div>
									{:else if searchQuery && loadingSearch}
										<div class="text-center py-8">
											<Loader2 class="w-8 h-8 mx-auto text-red-500 animate-spin mb-4" />
											<p class="text-gray-500 dark:text-gray-400">
												Searching for "{searchQuery}"...
											</p>
										</div>
									{:else if searchQuery && !loadingSearch && searchResults.length === 0}
										<div class="text-center py-8">
											<p class="text-gray-500 dark:text-gray-400">
												No results found for "{searchQuery}".
											</p>
											<button
												on:click={getRecommendations}
												class="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium hover:shadow-lg transition-all duration-200"
											>
												<Sparkles class="w-4 h-4 inline-block mr-1" />
												Try recommendations instead
											</button>
										</div>
									{:else}
										<div class="text-center py-8">
											<PlayCircle class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
											<p class="text-gray-500 dark:text-gray-400 mb-4">
												Search for a movie to nominate for movie night!
											</p>
											<p class="text-gray-500 dark:text-gray-400">- or -</p>
											<button
												on:click={getRecommendations}
												class="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
											>
												<Sparkles class="w-5 h-5 inline-block mr-2" />
												Get Movie Recommendations
											</button>
										</div>
									{/if}
								</div>
							{:else if !roomStatus.phase || roomStatus.phase === 'waiting'}
								<div class="text-center py-8">
									<p class="text-gray-500 dark:text-gray-400">
										Waiting for the host to start the movie night...
									</p>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	/* Custom styles for animation and effects */
	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}

	.pulse-animation {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
</style>
