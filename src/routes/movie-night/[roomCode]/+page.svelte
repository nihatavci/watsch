<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import confetti from 'canvas-confetti';
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

	// New variables for recommendations
	let showRecommendations = false;
	let recommendations: any[] = [];
	let loadingRecommendations = false;
	let searchResults: any[] = [];
	let loadingSearch = false;
	let searchTimeout: ReturnType<typeof setTimeout>;
	let selectedMovie: any = null;
	let nominatingMovie = false;

	// Store previous search query to preserve it during updates
	let previousSearchQuery = '';

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

		console.log('🔍 Host Detection Debug:', {
			username,
			roomCode,
			storedHostId,
			storedRoomCode,
			participantId,
			isHostCheck: storedRoomCode === roomCode && storedHostId
		});

		if (storedRoomCode === roomCode && storedHostId) {
			isHost = true;
			console.log('✅ User detected as HOST');
		} else {
			console.log('❌ User detected as PARTICIPANT');
		}

		// Fetch room status and possibly join the room
		initRoom();

		// Set up gentle polling every 10 seconds instead of aggressive 5 seconds
		// This reduces the refresh frequency significantly
		const pollInterval = setInterval(() => {
			// Only fetch if user is not actively typing
			if (searchQuery === previousSearchQuery) {
				fetchRoomStatus();
			}
			previousSearchQuery = searchQuery;
		}, 10000); // Increased from 5000 to 10000ms

		// Cleanup on component unmount
		return () => {
			if (pollInterval) clearInterval(pollInterval);
		};
	});

	// Handle search input changes more gracefully
	function handleSearchInput(event: Event) {
		const target = event.target as HTMLInputElement;
		searchQuery = target.value;
		searchMovies();
	}

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
		
		console.log('Starting voting - Current room status:', {
			phase: roomStatus?.phase,
			nominations: roomStatus?.nominations?.length || 0,
			participantCount: roomStatus?.participants?.length || 0
		});

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

			const data = await response.json();
			console.log('Voting started successfully:', data);

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

			// Trigger confetti animation
			if (browser) {
				triggerConfetti();
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
			const response = await fetch(`/api/movie-night/room-status?roomCode=${roomCode}`);

			if (!response.ok) {
				if (response.status === 404) {
					error = 'Room not found. Please check the room code.';
				} else {
					const errorData = await response.json();
					error = errorData.error?.message || 'Failed to get room status';
				}
				loading = false;
				return;
			}

			const data = await response.json();
			roomStatus = data.room;
			loading = false;
			error = '';

			// Additional host detection logic - check if we're the host based on room data
			const storedHostId = localStorage.getItem('movie_night_host_id');
			if (storedHostId && roomStatus?.hostId && storedHostId === roomStatus.hostId) {
				isHost = true;
				console.log('✅ Host status confirmed via room data');
			} else if (storedHostId && roomStatus?.participants) {
				// Check if our stored host ID matches any participant marked as host
				const hostParticipant = roomStatus.participants.find((p: any) => p.isHost);
				if (hostParticipant && hostParticipant.id === storedHostId) {
					isHost = true;
					console.log('✅ Host status confirmed via participant data');
				}
			}

			console.log('📊 Room Status Update:', {
				phase: roomStatus?.phase,
				nominationsCount: roomStatus?.nominations?.length || 0,
				participantsCount: roomStatus?.participants?.length || 0,
				isHost,
				showingHostControls: isHost,
				hostIdInRoom: roomStatus?.hostId,
				storedHostId,
				participants: roomStatus?.participants?.map((p: any) => ({ id: p.id, nickname: p.nickname, isHost: p.isHost }))
			});

			// Update participants list for UI display
			if (roomStatus.participants) {
				participantsList = roomStatus.participants.map((p: any) => ({
					id: p.id,
					nickname: p.nickname
				}));
			}
		} catch (err) {
			console.error('Error fetching room status:', err);
			error = 'Failed to connect to room';
			loading = false;
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
			error = ''; // Clear any previous errors

			// Get a mix of popular movies and TV shows
			const response = await fetch('/api/getRecommendation', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					query: 'movie, Action, Adventure, Comedy',
					mediaType: 'movie',
					genres: ['Action', 'Adventure', 'Comedy'],
					platforms: [],
					count: 6 // Limit recommendations for better UX
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to get recommendations');
			}

			recommendations = await response.json();
		} catch (err) {
			console.error('Error getting recommendations:', err);
			recommendations = [];
			error = err instanceof Error ? err.message : 'Failed to get recommendations. Please try searching instead.';
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

		// Set a longer timeout to avoid making too many requests while typing
		searchTimeout = setTimeout(async () => {
			try {
				loadingSearch = true;
				error = ''; // Clear any previous errors

				const response = await fetch(
					`/api/tmdb/search?query=${encodeURIComponent(searchQuery)}&type=movie`
				);

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || 'Failed to search movies');
				}

				const data = await response.json();
				
				// Handle different possible response structures
				if (data.success && data.data && data.data.data && data.data.data.results) {
					searchResults = data.data.data.results;
				} else if (data.data && data.data.results) {
					searchResults = data.data.results;
				} else if (data.results) {
					searchResults = data.results;
				} else {
					searchResults = [];
				}
				
				// Limit to max 8 results for better performance and less UI disruption
				searchResults = searchResults.slice(0, 8);
			} catch (err) {
				console.error('Error searching movies:', err);
				searchResults = [];
				error = err instanceof Error ? err.message : 'Failed to search movies. Please try again.';
			} finally {
				loadingSearch = false;
			}
		}, 500); // Increased timeout from 300ms to 500ms for less API calls while typing
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

	// Function to vote for a movie
	async function voteForMovie(nomination: any) {
		try {
			// Get the current participant ID more reliably
			let currentParticipantId = participantId;
			if (!currentParticipantId) {
				currentParticipantId = localStorage.getItem('movie_night_host_id') || '';
			}
			
			// If still no participant ID, find by nickname
			if (!currentParticipantId && roomStatus?.participants) {
				const foundParticipant = roomStatus.participants.find(
					(p: any) => p.nickname.toLowerCase() === username.toLowerCase()
				);
				if (foundParticipant) {
					currentParticipantId = foundParticipant.id;
				}
			}

			const response = await fetch('/api/movie-night/vote', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					roomCode,
					movieId: nomination.movie.id.toString(),
					participantId: currentParticipantId,
					nickname: username
				})
			});

			const responseData = await response.json();

			if (!response.ok) {
				throw new Error(responseData.error?.message || 'Failed to vote');
			}

			// Show success message
			console.log('Vote successful:', responseData.message);
			
			// Refresh room status to show updated votes
			await fetchRoomStatus();
			
			// Clear any previous errors
			error = '';
			
		} catch (err) {
			console.error('Error voting for movie:', err);
			error = err instanceof Error ? err.message : 'Failed to vote for movie';
		}
	}

	// Function to draw winner directly without voting
	async function drawWinnerDirectly() {
		if (!isHost || !roomStatus?.nominations) return;

		try {
			finishingVoting = true;

			// Pick a random nomination as the winner
			const randomIndex = Math.floor(Math.random() * roomStatus.nominations.length);
			const winningNomination = roomStatus.nominations[randomIndex];

			// Create winner object
			const winner = {
				...winningNomination.movie,
				nominatedByNickname: winningNomination.participant?.nickname || 'Unknown',
				voteCount: 0,
				randomlySelected: true
			};

			// Update room to complete phase with winner
			const response = await fetch('/api/movie-night/finish-voting', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					roomCode,
					forceWinner: winner
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error?.message || 'Failed to draw winner');
			}

			// Trigger confetti animation
			if (browser) {
				triggerConfetti();
			}

			// Refresh room status to show winner
			await fetchRoomStatus();
			
		} catch (err) {
			console.error('Error drawing winner:', err);
			error = err instanceof Error ? err.message : 'Failed to draw winner';
		} finally {
			finishingVoting = false;
		}
	}

	// Confetti animation function
	function triggerConfetti() {
		if (!browser) return;

		// Create multiple bursts for dramatic effect
		const duration = 3000;
		const colors = ['#dc2626', '#7c3aed', '#059669', '#ea580c', '#0891b2'];

		// First burst from left
		confetti({
			particleCount: 100,
			spread: 70,
			origin: { x: 0.2, y: 0.6 },
			colors: colors
		});

		// Second burst from right
		setTimeout(() => {
			confetti({
				particleCount: 100,
				spread: 70,
				origin: { x: 0.8, y: 0.6 },
				colors: colors
			});
		}, 250);

		// Center burst
		setTimeout(() => {
			confetti({
				particleCount: 150,
				spread: 100,
				origin: { x: 0.5, y: 0.5 },
				colors: colors
			});
		}, 500);

		// Final shower
		setTimeout(() => {
			confetti({
				particleCount: 200,
				spread: 120,
				origin: { x: 0.5, y: 0.3 },
				colors: colors,
				gravity: 0.8
			});
		}, 750);
	}

	// Watch searchQuery for changes
	$: if (searchQuery) {
		searchMovies();
	} else {
		// Clear results and errors when search query is empty
		searchResults = [];
		error = '';
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
									<div class="flex flex-col sm:flex-row gap-4">
										<button
											on:click={startVoting}
											disabled={startingVoting ||
												!roomStatus.nominations || 
												roomStatus.nominations.length === 0}
											class="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:hover:transform-none disabled:hover:shadow-lg flex items-center gap-2"
										>
											{#if startingVoting}
												<Loader2 class="w-6 h-6 animate-spin" />
												<span>Starting Voting...</span>
											{:else}
												<ThumbsUp class="w-6 h-6" />
												<span>
													{#if !roomStatus.nominations || roomStatus.nominations.length === 0}
														Start Voting (Need nominations)
													{:else}
														Start Voting ({roomStatus.nominations.length} nominations)
													{/if}
												</span>
											{/if}
										</button>
										
										<!-- Skip voting and draw winner directly -->
										{#if roomStatus.nominations && roomStatus.nominations.length > 0}
											<button
												on:click={drawWinnerDirectly}
												disabled={finishingVoting}
												class="px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:hover:transform-none disabled:hover:shadow-lg flex items-center gap-2"
											>
												<Sparkles class="w-6 h-6" />
												<span>Skip Voting - Draw Winner!</span>
											</button>
										{/if}
									</div>
								{:else if roomStatus.phase === 'vote' || roomStatus.phase === 'voting'}
									<div class="flex gap-4">
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
												<span>Finish Voting & Reveal Winner</span>
											{/if}
										</button>
										
										<!-- Skip voting and draw winner directly -->
										<button
											on:click={drawWinnerDirectly}
											disabled={finishingVoting}
											class="px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:hover:transform-none disabled:hover:shadow-lg flex items-center gap-2"
										>
											<Sparkles class="w-6 h-6" />
											<span>Draw Winner Now!</span>
										</button>
									</div>
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
							{:else if roomStatus.phase === 'nominating' || roomStatus.phase === 'nominate'}
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
												value={searchQuery}
												on:input={handleSearchInput}
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
							{#if error}
								<div class="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
									<p class="text-red-600 dark:text-red-400 text-sm">
										{error}
									</p>
								</div>
							{/if}
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

									<!-- NOMINATIONS DISPLAY SECTION -->
									{#if roomStatus.nominations && roomStatus.nominations.length > 0}
										<div class="mt-8">
											<div class="flex items-center justify-between mb-4">
												<h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
													<Film class="w-6 h-6 text-red-500" />
													Current Nominations ({roomStatus.nominations.length})
												</h3>
												<div class="text-sm text-gray-600 dark:text-gray-400">
													{roomStatus.nominations.length >= 2 ? 'Ready to vote!' : 'Need more nominations'}
												</div>
											</div>
											
											<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
												{#each roomStatus.nominations as nomination}
													<div class="p-4 rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 shadow-sm">
														<div class="flex gap-4">
															{#if nomination.movie?.poster_path}
																<img
																	src={nomination.movie.poster_path.startsWith('http') 
																		? nomination.movie.poster_path 
																		: `https://image.tmdb.org/t/p/w200${nomination.movie.poster_path}`}
																	alt={nomination.movie.title}
																	class="w-16 h-24 object-cover rounded-lg flex-shrink-0"
																/>
															{:else}
																<div class="w-16 h-24 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
																	<Film class="w-6 h-6 text-gray-400" />
																</div>
															{/if}
															
															<div class="flex-grow">
																<h4 class="font-bold text-gray-900 dark:text-white text-lg">
																	{nomination.movie?.title || 'Unknown Movie'}
																</h4>
																
																{#if nomination.movie?.release_date}
																	<p class="text-gray-600 dark:text-gray-400 text-sm">
																		{new Date(nomination.movie.release_date).getFullYear()}
																	</p>
																{/if}
																
																{#if nomination.movie?.vote_average}
																	<div class="flex items-center gap-1 mt-1">
																		<span class="text-yellow-500">★</span>
																		<span class="text-sm text-gray-600 dark:text-gray-400">
																			{nomination.movie.vote_average.toFixed(1)}
																		</span>
																	</div>
																{/if}
																
																<div class="mt-2 flex items-center gap-2">
																	<Crown class="w-4 h-4 text-purple-500" />
																	<span class="text-sm font-medium text-purple-700 dark:text-purple-300">
																		Nominated by {nomination.participant?.nickname || 'Unknown'}
																	</span>
																</div>
															</div>
														</div>
													</div>
												{/each}
											</div>
										</div>
									{:else}
										<div class="mt-8 text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600">
											<Film class="w-12 h-12 mx-auto text-gray-400 mb-3" />
											<p class="text-gray-600 dark:text-gray-400 font-medium">No nominations yet</p>
											<p class="text-gray-500 dark:text-gray-500 text-sm">Be the first to nominate a movie!</p>
										</div>
									{/if}
								</div>
							{:else if roomStatus.phase === 'voting' || roomStatus.phase === 'vote'}
								<div class="space-y-6">
									<div class="text-center">
										<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
											Vote for Your Favorite Movie!
										</h3>
										<p class="text-gray-600 dark:text-gray-400">
											Choose the movie you'd most like to watch tonight
										</p>
									</div>

									<!-- Show error if present -->
									{#if error}
										<div class="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300">
											<div class="flex items-center gap-2">
												<AlertCircle class="w-5 h-5" />
												<span class="font-medium">Error:</span>
											</div>
											<p class="mt-1">{error}</p>
										</div>
									{/if}

									{#if roomStatus.nominations && roomStatus.nominations.length > 0}
										<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
											{#each roomStatus.nominations as nomination}
												<div class="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-shadow">
													<div class="flex gap-4">
														{#if nomination.movie?.poster_path}
															<img
																src={nomination.movie.poster_path.startsWith('http') 
																	? nomination.movie.poster_path 
																	: `https://image.tmdb.org/t/p/w200${nomination.movie.poster_path}`}
																alt={nomination.movie.title}
																class="w-20 h-30 object-cover rounded-lg flex-shrink-0"
															/>
														{:else}
															<div class="w-20 h-30 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
																<Film class="w-8 h-8 text-gray-400" />
															</div>
														{/if}
														
														<div class="flex-grow">
															<h4 class="font-bold text-gray-900 dark:text-white text-xl">
																{nomination.movie?.title || 'Unknown Movie'}
															</h4>
															
															{#if nomination.movie?.overview}
																<p class="text-gray-700 dark:text-gray-300 text-sm mt-1 line-clamp-2">
																	{nomination.movie.overview}
																</p>
															{/if}
															
															<div class="mt-3 flex items-center justify-between">
																<div class="flex items-center gap-2">
																	<Crown class="w-4 h-4 text-purple-500" />
																	<span class="text-sm text-purple-700 dark:text-purple-300">
																		{nomination.participant?.nickname || 'Unknown'}
																	</span>
																</div>
																
																{#if nomination.movie?.vote_average}
																	<div class="flex items-center gap-1">
																		<span class="text-yellow-500">★</span>
																		<span class="text-sm text-gray-600 dark:text-gray-400">
																			{nomination.movie.vote_average.toFixed(1)}
																		</span>
																	</div>
																{/if}
															</div>

															<!-- Check if user has already voted for this movie -->
															{#if roomStatus.votes && Object.values(roomStatus.votes).some((voteArray: unknown) => 
																Array.isArray(voteArray) && voteArray.some((vote: any) => 
																	vote.nickname?.toLowerCase() === username.toLowerCase() && 
																	vote.movieId === nomination.movie.id.toString()
																)
															)}
																<div class="mt-3 w-full px-4 py-2 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 font-medium text-center flex items-center justify-center gap-2">
																	<ThumbsUp class="w-4 h-4" />
																	You voted for this!
																</div>
															{:else if roomStatus.votes && Object.values(roomStatus.votes).some((voteArray: unknown) => 
																Array.isArray(voteArray) && voteArray.some((vote: any) => vote.nickname?.toLowerCase() === username.toLowerCase())
															)}
																<div class="mt-3 w-full px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium text-center">
																	You've already voted
																</div>
															{:else}
																<button
																	on:click={() => voteForMovie(nomination)}
																	class="mt-3 w-full px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
																>
																	<ThumbsUp class="w-4 h-4" />
																	Vote for This Movie
																</button>
															{/if}
														</div>
													</div>
												</div>
											{/each}
										</div>
									{:else}
										<div class="text-center py-8">
											<AlertCircle class="w-16 h-16 mx-auto text-gray-400 mb-4" />
											<p class="text-gray-600 dark:text-gray-400">
												No nominations available for voting
											</p>
										</div>
									{/if}
								</div>
							{:else if roomStatus.phase === 'complete'}
								<div class="text-center py-8 relative">
									<!-- Confetti will be triggered by the finish voting function -->
									
									<div class="mb-6">
										<PartyPopper class="w-20 h-20 mx-auto text-yellow-500 mb-4 animate-bounce" />
										<Crown class="w-12 h-12 mx-auto text-yellow-500 -mt-6 mb-4" />
									</div>
									
									<h3 class="text-3xl font-bold text-gray-900 dark:text-white mb-4 animate-pulse">
										🎉 Winner Announced! 🎉
									</h3>
									
									{#if roomStatus.winner}
										<div class="max-w-md mx-auto mt-6 p-8 rounded-3xl bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-300 dark:border-yellow-700 shadow-2xl transform hover:scale-105 transition-transform duration-300">
											{#if roomStatus.winner.poster_path}
												<div class="relative mb-6">
													<img
														src={roomStatus.winner.poster_path.startsWith('http') 
															? roomStatus.winner.poster_path 
															: `https://image.tmdb.org/t/p/w300${roomStatus.winner.poster_path}`}
														alt={roomStatus.winner.title}
														class="w-40 h-60 object-cover rounded-xl mx-auto shadow-lg"
													/>
													<div class="absolute -top-2 -right-2 bg-yellow-400 text-black p-2 rounded-full shadow-lg">
														<Crown class="w-6 h-6" />
													</div>
												</div>
											{/if}
											
											<h4 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
												{roomStatus.winner.title}
											</h4>
											
											<p class="text-yellow-700 dark:text-yellow-300 mb-3 font-medium">
												Nominated by {roomStatus.winner.nominatedByNickname}
											</p>
											
											{#if roomStatus.winner.randomlySelected}
												<div class="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium mb-3">
													<Sparkles class="w-4 h-4" />
													Randomly Selected by Host!
												</div>
											{:else if roomStatus.winner.voteCount > 0}
												<div class="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium mb-3">
													<ThumbsUp class="w-4 h-4" />
													Won with {roomStatus.winner.voteCount} vote{roomStatus.winner.voteCount !== 1 ? 's' : ''}!
												</div>
											{:else}
												<div class="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium mb-3">
													<Crown class="w-4 h-4" />
													Default Winner (No Votes)
												</div>
											{/if}
											
											<div class="text-lg font-semibold text-gray-900 dark:text-white mt-4">
												🍿 Enjoy your movie night! 🍿
											</div>
										</div>
									{:else}
										<div class="p-6 rounded-xl bg-gray-100 dark:bg-gray-800">
											<Loader2 class="w-8 h-8 mx-auto animate-spin text-yellow-500 mb-2" />
											<p class="text-gray-600 dark:text-gray-400">
												Calculating results...
											</p>
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
