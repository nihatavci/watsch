<script lang="ts" context="module">
	let globalRoomPhase: 'join' | 'nominate' | 'vote' | 'results' | null = null;
	let globalRoomCode: string | null = null;
	let globalParticipants: Array<{ id: string; nickname: string }> = [];
</script>

<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { i18nStore } from './i18n';
	import { showNotification } from '../stores/notifications';
	import Button from './ui/button.svelte';
	import Card from './ui/card.svelte';
	import CardContent from './ui/card-content.svelte';
	import { Copy, Users, Trophy, Search, X, Film } from 'lucide-svelte';
	import { onDestroy, onMount } from 'svelte';
	import confetti from 'canvas-confetti';
	import Form from './Form.svelte';
	import RecommendationCard from './RecommendationCard.svelte';
	import { library } from '../stores/library';
	import { sidebar } from '../stores/sidebar';

	interface Movie {
		title: string;
		description: string;
		poster_path?: string;
		release_date?: string;
	}

	let roomCode = '';
	let nickname = '';
	let isHost = false;
	let roomPhase: 'join' | 'nominate' | 'vote' | 'results' = 'join';
	let participants: Array<{ id: string; nickname: string; nominated?: any }> = [];
	let nominations: Array<any> = [];
	let votes: Record<string, string[]> = {};
	let isCopying = false;
	let participantId: string | null = null;
	let showRecommendationForm = false;
	let recommendations: Movie[] = [];
	let loading = false;
	let showOnboarding = false;
	let currentStep = 0;
	let targetElement: HTMLElement | null = null;
	let pulseInterval: number;

	function startPulseEffect() {
		if (targetElement) {
			targetElement.classList.add('pulse-effect');
		}
	}

	function stopPulseEffect() {
		if (targetElement) {
			targetElement.classList.remove('pulse-effect');
		}
	}

	function updateTargetElement() {
		stopPulseEffect();
		const selector = onboardingSteps[currentStep].target;
		targetElement = document.querySelector(selector);
		startPulseEffect();
	}

	const onboardingSteps = [
		{
			target: '#nickname',
			content: 'First, enter your nickname - this is required to join or create a room! 🌟',
			action: 'input',
			waitForAction: false
		},
		{
			target: '#create-room-btn',
			content: 'Create your own movie night room and invite friends!',
			action: 'click',
			waitForAction: true
		},
		{
			target: '#join-room-btn',
			content: 'Or join your friends using their room code',
			action: 'click',
			waitForAction: true
		},
		{
			target: '#find-movies-btn',
			content: 'Once in a room, discover movies to watch together',
			action: 'click',
			waitForAction: true
		},
		{
			target: '#library-btn',
			content: 'You can also pick from your saved movies',
			action: 'click',
			waitForAction: true
		}
	];

	function handleOnboardingAction(event: Event) {
		const currentStepData = onboardingSteps[currentStep];
		if (!currentStepData.waitForAction) {
			nextStep();
			return;
		}

		const target = event.target as HTMLElement;
		const targetSelector = currentStepData.target;
		
		if (target.matches(targetSelector) || target.closest(targetSelector)) {
			nextStep();
		}
	}

	function startOnboarding() {
		showOnboarding = true;
		currentStep = 0;
		document.addEventListener('click', handleOnboardingAction);
		document.addEventListener('input', handleOnboardingAction);
		updateTargetElement();
	}

	function stopOnboarding() {
		showOnboarding = false;
		document.removeEventListener('click', handleOnboardingAction);
		document.removeEventListener('input', handleOnboardingAction);
		stopPulseEffect();
	}

	function nextStep() {
		if (currentStep < onboardingSteps.length - 1) {
			currentStep++;
			updateTargetElement();
		} else {
			stopOnboarding();
			localStorage.setItem('onboardingComplete', 'true');
		}
	}

	onDestroy(() => {
		stopOnboarding();
	});

	// Load session from localStorage
	onMount(() => {
		try {
			const session = localStorage.getItem('movieNightSession');
			if (session) {
				const data = JSON.parse(session);
				roomCode = data.roomCode;
				nickname = data.nickname;
				isHost = data.isHost;
				participantId = data.participantId;
				roomPhase = data.roomPhase;
				startPolling();
			}
		} catch (error) {
			console.error('Error loading session:', error);
		}
	});

	// Save session to localStorage
	function saveSession() {
		try {
			localStorage.setItem(
				'movieNightSession',
				JSON.stringify({
					roomCode,
					nickname,
					isHost,
					participantId,
					roomPhase
				})
			);
		} catch (error) {
			console.error('Error saving session:', error);
		}
	}

	function leaveRoom() {
		try {
			localStorage.removeItem('movieNightSession');
			roomCode = '';
			nickname = '';
			isHost = false;
			participantId = null;
			roomPhase = 'join';
			if (pollingInterval) {
				clearInterval(pollingInterval);
			}
		} catch (error) {
			console.error('Error leaving room:', error);
		}
	}

	async function createRoom() {
		if (!nickname.trim()) {
			showNotification('Please enter your nickname');
			return;
		}

		try {
			console.log('Creating room with nickname:', nickname);
			const response = await fetch('/api/movie-night/create-room', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ hostNickname: nickname })
			});
			
			const responseText = await response.text();
			console.log('Create room response:', responseText);
			
			if (!response.ok) {
				let error;
				try {
					error = JSON.parse(responseText);
				} catch {
					error = { error: { message: responseText } };
				}
				showNotification(error.error.message);
				return;
			}

			const data = JSON.parse(responseText);
			roomCode = data.roomCode;
			isHost = true;
			participantId = data.hostId;
			participants = [{ id: data.hostId, nickname }];
			roomPhase = 'nominate';
			
			startPolling();
		} catch (error) {
			console.error('Error creating room:', error);
			showNotification('Failed to create room. Please try again.');
		}
	}

	async function joinRoom() {
		if (!nickname.trim() || !roomCode.trim()) {
			showNotification('Please enter your nickname and room code');
			return;
		}

		try {
			console.log('Joining room:', roomCode, 'with nickname:', nickname);
			const response = await fetch('/api/movie-night/join-room', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ roomCode, nickname })
			});
			
			const responseText = await response.text();
			console.log('Join room response:', responseText);
			
			if (!response.ok) {
				let error;
				try {
					error = JSON.parse(responseText);
				} catch {
					error = { error: { message: responseText } };
				}
				showNotification(error.error.message);
				return;
			}

			const data = JSON.parse(responseText);
			participantId = data.participantId;
			participants = data.participants;
			roomPhase = data.phase;
			nominations = data.nominations || [];
			isHost = false;
			
			startPolling();
		} catch (error) {
			console.error('Error joining room:', error);
			showNotification('Failed to join room. Please try again.');
		}
	}

	async function startVotingPhase() {
		if (!isHost) {
			console.log('Not host, cannot start voting');
			return;
		}
		
		try {
			loading = true;
			console.log('Starting voting phase for room:', roomCode);
			const response = await fetch('/api/movie-night/start-voting', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ roomCode })
			});
			
			const responseText = await response.text();
			console.log('Start voting response:', responseText);
			
			if (!response.ok) {
				let error;
				try {
					error = JSON.parse(responseText);
				} catch {
					error = { error: { message: responseText } };
				}
				showNotification(error.error.message);
				return;
			}

			// Add a small delay for visual feedback
			await new Promise(resolve => setTimeout(resolve, 800));
			const data = JSON.parse(responseText);
			roomPhase = data.phase;
			console.log('Room phase updated to:', roomPhase);
		} catch (error) {
			console.error('Error starting voting phase:', error);
			showNotification($i18nStore.t('movie_night.start_voting_error'));
		} finally {
			loading = false;
		}
	}

	let pollingInterval: number;

	function startPolling() {
		if (pollingInterval) {
			clearInterval(pollingInterval);
		}

		pollingInterval = setInterval(async () => {
			try {
				console.log('Polling room status for room:', roomCode);
				const response = await fetch(`/api/movie-night/room-status?roomCode=${roomCode}`);
				const responseText = await response.text();
				console.log('Room status response:', responseText);
				
				if (!response.ok) {
					console.error('Room status error:', responseText);
					return;
				}

				const data = JSON.parse(responseText);
				participants = data.participants;
				nominations = data.nominations || [];
				votes = data.votes || {};
				roomPhase = data.phase;
				console.log('Updated room state:', { participants, nominations, votes, roomPhase });
				
				if (data.phase === 'results') {
					clearInterval(pollingInterval);
				}
			} catch (error) {
				console.error('Error polling room status:', error);
			}
		}, 3000) as unknown as number;
	}

	onDestroy(() => {
		if (pollingInterval) {
			clearInterval(pollingInterval);
		}
	});

	async function copyRoomCode() {
		try {
			isCopying = true;
			await navigator.clipboard.writeText(roomCode);
			showNotification('Room code copied to clipboard!');
			await new Promise(resolve => setTimeout(resolve, 1000));
		} catch (error) {
			console.error('Failed to copy:', error);
		} finally {
			isCopying = false;
		}
	}

	function blurActiveElement() {
		if (document.activeElement instanceof HTMLElement) {
			document.activeElement.blur();
		}
	}

	async function nominateMovie(movie: any) {
		blurActiveElement();
		try {
			loading = true;
			console.log('Nominating movie:', movie);
			const response = await fetch('/api/movie-night/nominate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ roomCode, nickname, movie })
			});
			
			const responseText = await response.text();
			console.log('Nominate response:', responseText);
			
			if (!response.ok) {
				let error;
				try {
					error = JSON.parse(responseText);
				} catch {
					error = { error: { message: responseText } };
				}
				showNotification(error.error.message);
				return;
			}

			const data = JSON.parse(responseText);
			// Add a small delay for visual feedback
			await new Promise(resolve => setTimeout(resolve, 500));
			nominations = data.nominations;
			
			// Trigger confetti on successful nomination
			confetti({
				particleCount: 50,
				spread: 60,
				origin: { y: 0.7 }
			});

			// Hide recommendation form after successful nomination
			showRecommendationForm = false;
			recommendations = [];
		} catch (error) {
			console.error('Error nominating movie:', error);
			showNotification($i18nStore.t('movie_night.nominate_error'));
		} finally {
			loading = false;
		}
	}

	// Type-safe vote checking
	function hasVoted(movieTitle: string): boolean {
		if (!participantId) return false;
		return votes[participantId]?.includes(movieTitle) || false;
	}

	function getRemainingVotes(): number {
		if (!participantId) return 1;
		return 1 - (votes[participantId]?.length || 0);
	}

	async function submitVote(movieTitle: string) {
		blurActiveElement();
		if (!participantId) return;
		if (loading) return;

		try {
			loading = true;
			const currentVotes = votes[participantId] || [];
			let newVotes = [...currentVotes];

			if (currentVotes.includes(movieTitle)) {
				// Remove vote if already voted
				newVotes = currentVotes.filter(v => v !== movieTitle);
			} else if (currentVotes.length < 1) {
				// Add vote if under limit
				newVotes = [...currentVotes, movieTitle];
			} else {
				showNotification($i18nStore.t('movie_night.max_votes_reached'));
				return;
			}

			const response = await fetch('/api/movie-night/vote', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					roomCode,
					nickname,
					votes: newVotes
				})
			});

			const data = await response.json();
			votes = data.votes;
			if (data.phase === 'results') {
				roomPhase = 'results';
			}
		} catch (error) {
			console.error('Error submitting vote:', error);
			showNotification($i18nStore.t('movie_night.vote_error'));
		} finally {
			loading = false;
		}
	}

	async function finishVoting() {
		if (!isHost) return;
		try {
			loading = true;
			const response = await fetch('/api/movie-night/finish-voting', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ roomCode })
			});

			if (!response.ok) {
				throw new Error('Failed to finish voting');
			}

			await new Promise(resolve => setTimeout(resolve, 800)); // Add delay for visual feedback
			const data = await response.json();
			roomPhase = 'results';
			
			// Trigger confetti for the winner announcement
			confetti({
				particleCount: 150,
				spread: 80,
				origin: { y: 0.6 }
			});
		} catch (error) {
			console.error('Error finishing voting:', error);
			showNotification('Failed to finish voting. Please try again.');
		} finally {
			loading = false;
		}
	}

	async function handleRecommendationSubmit(event: CustomEvent<{ cinemaType: string; categories: string[]; platforms: string[]; descriptors: string }>) {
		const criteria = event.detail;
		loading = true;
		try {
			// Construct search criteria
			let searchCriteria = `Give me a list of 5 ${criteria.cinemaType} recommendations`;
			if (criteria.categories.length > 0) {
				searchCriteria += ` in these genres: ${criteria.categories.join(', ')}`;
			}
			if (criteria.platforms.length > 0) {
				searchCriteria += ` available on ${criteria.platforms.join(' or ')}`;
			}
			if (criteria.descriptors) {
				searchCriteria += `. Additional preferences: ${criteria.descriptors}`;
			}

			// Get recommendations from OpenAI
			const response = await fetch('/api/getRecommendation', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ searched: searchCriteria })
			});

			if (!response.ok) throw new Error('Failed to get recommendations');

			const data = await response.json();
			
			// Process recommendations and fetch movie details
			const recommendationsWithDetails = await Promise.all(
				data.recommendations.map(async (rec: string) => {
					const match = rec.match(/\d+\.\s*(.*?):\s*(.*)/);
					if (!match) return null;
					const [, title, description] = match;
					
					// Fetch movie details from TMDB
					const detailsResponse = await fetch(`/api/movie-details?title=${encodeURIComponent(title)}`);
					const details = await detailsResponse.json();
					
					return {
						title,
						description,
						poster_path: details.poster_path,
						release_date: details.release_date
					} as Movie;
				})
			);

			recommendations = recommendationsWithDetails.filter((rec): rec is Movie => rec !== null);
			showNotification('Got recommendations!');
		} catch (error) {
			console.error('Error getting recommendations:', error);
			showNotification('Could not get recommendations. Please try again.');
		} finally {
			loading = false;
		}
	}

	function handleLibraryClick() {
		sidebar.set({ isOpen: true, view: 'library' });
		const unsubscribe = library.subscribe((state) => {
			if (state.selectedMovie) {
				nominateMovie({
					title: state.selectedMovie.title,
					description: state.selectedMovie.description || 'No description available',
					poster_path: state.selectedMovie.poster_path,
					release_date: state.selectedMovie.release_date
				});
				sidebar.set({ isOpen: false, view: null });
			}
		});

		unsubscribe();
	}

	$: console.log('Current state:', { roomPhase, isHost, participants });

	// Save session after important state changes
	$: {
		if (roomCode && nickname && participantId) {
			saveSession();
		}
	}

	function handleClick(callback: () => void) {
		return () => {
			const element = document.activeElement as HTMLElement | null;
			if (element?.blur) {
				element.blur();
			}
			callback();
		};
	}

	// Update global state for header
	$: {
		globalRoomPhase = roomPhase;
		globalRoomCode = roomCode;
		globalParticipants = participants;
	}

	$: {
		if (showOnboarding && currentStep >= 0) {
			updateTargetElement();
		}
	}

	onMount(() => {
		const onboardingComplete = localStorage.getItem('onboardingComplete');
		if (!onboardingComplete) {
			setTimeout(() => {
				startOnboarding();
			}, 1500);
		}
	});

	// Add helper function for positioning tooltips
	function getTargetPosition(selector: string) {
		const element = document.querySelector(selector);
		if (!element) return null;
		
		const rect = element.getBoundingClientRect();
		return {
			x: rect.left + rect.width / 2,
			y: rect.bottom + window.scrollY
		};
	}
</script>

<div class="min-h-screen">
	{#if roomPhase === 'join'}
		<div class="max-w-3xl mx-auto px-4 py-8">
			<div class="text-center mb-12">
				<h1 class="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
					<span class="inline-block hover:scale-110 transition-transform cursor-default">🍿</span>
					<span class="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80">Movie Night Fun!</span>
				</h1>
				<p class="text-lg text-white/70 mb-6">Grab your snacks and join the movie party!</p>
				<div class="relative inline-block">
					<button
						class="mx-auto px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/90 hover:text-white transition-all duration-300 flex items-center gap-3 group hover:scale-105 relative"
						on:click={startOnboarding}
					>
						<span class="text-lg">How does this work?</span>
						<span class="text-2xl group-hover:rotate-12 transition-transform inline-block">🤔</span>
					</button>
					<div class="absolute inset-0 rounded-xl bg-gradient-to-r from-[#E50914]/20 to-purple-900/20 blur-xl -z-10"></div>
				</div>
			</div>

			<Card class="relative overflow-hidden">
				<div class="absolute inset-0 bg-gradient-to-br from-[#E50914]/5 to-purple-900/5"></div>
				<CardContent class="p-6 sm:p-8 relative">
					<div class="space-y-8">
						<div class="text-center">
							<div class="w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-6 transform hover:scale-110 transition-transform cursor-default">
								<span class="text-7xl">🎬</span>
							</div>
							<h2 class="text-2xl sm:text-3xl font-bold text-white mb-3">Join the Fun!</h2>
							<p class="text-white/60 text-lg">Create a room or hop into an existing one</p>
						</div>

						<div class="space-y-6">
							<div class="relative">
								<label for="nickname" class="block text-base font-medium text-white/90 mb-3 flex items-center gap-2">
									<div class="flex items-center gap-2">
										<span>Your Movie Star Name</span>
										<span class="text-[#E50914] text-lg">*</span>
									</div>
									<span class="text-xl hover:scale-110 transition-transform cursor-default inline-block">🌟</span>
								</label>
								<input
									type="text"
									id="nickname"
									bind:value={nickname}
									class="w-full px-5 py-3 rounded-xl bg-black/30 border-2 border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#E50914]/50 transition-all duration-300"
									placeholder="This is required to join the fun!"
									required
								/>
							</div>

							<div class="flex flex-col sm:flex-row gap-4">
								<div class="relative flex-1 group">
									<Button
										id="create-room-btn"
										on:click={createRoom}
										class="w-full bg-gradient-to-r from-[#E50914] to-[#B20710] hover:from-[#B20710] hover:to-[#E50914] text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3 group relative"
									>
										<Users size={24} class="transform transition-transform group-hover:rotate-12" />
										<span class="text-lg">Start the Party!</span>
									</Button>
									<div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
										<div class="absolute inset-0 rounded-xl bg-[#E50914] blur-xl -z-10"></div>
									</div>
								</div>

								<div id="join-room-btn" class="flex-1 space-y-3">
									<input
										type="text"
										bind:value={roomCode}
										class="w-full px-5 py-3 rounded-xl bg-black/30 border-2 border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#E50914]/50 transition-all duration-300"
										placeholder="Got a room code?"
									/>
									<Button
										on:click={joinRoom}
										class="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm group relative"
									>
										<span class="text-lg">Join In!</span>
										<span class="ml-2 inline-block transform transition-transform group-hover:rotate-12 text-xl">🎉</span>
									</Button>
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	{:else}
		<div class="max-w-3xl mx-auto px-4 py-8">
			<Card class="backdrop-blur-xl border border-white/10">
				<CardContent class="p-4 sm:p-6">
					<div class="space-y-6">
						<!-- Room Info -->
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-4">
								<div class="flex items-center gap-2 text-white/70">
									<span class="text-sm">Room:</span>
									<code class="bg-white/10 px-2 py-1 rounded text-sm">{roomCode}</code>
									<button
										on:click={copyRoomCode}
										class="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
										title="Copy room code"
									>
										<Copy size={16} class="text-white/70" />
									</button>
								</div>
								<div class="flex items-center gap-2 text-white/70">
									<Users size={16} />
									<span class="text-sm">{participants.length} Players</span>
								</div>
							</div>
							<Button
								on:click={leaveRoom}
								class="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 text-sm rounded-lg transition-colors backdrop-blur-sm flex items-center gap-2"
							>
								<X size={16} />
								<span>Leave Room</span>
							</Button>
						</div>

						<!-- Rest of the content -->
						<div class="space-y-6">
							<!-- Participants -->
							<div>
								<div class="flex justify-between items-center mb-2">
									<h3 class="text-sm font-medium text-white/70">Participants</h3>
									<div class="flex items-center gap-2 text-white/70">
										<Users size={16} />
										<span class="text-sm">{participants.length} Players</span>
									</div>
								</div>
								<div class="flex flex-wrap gap-2">
									{#each participants as participant}
										<div class="px-3 py-1 rounded-full bg-white/10 text-white/90 text-sm backdrop-blur-sm">
											{participant.nickname}
											{#if participant.id === participantId}
												<span class="ml-1 opacity-50">(you)</span>
											{/if}
										</div>
									{/each}
								</div>
							</div>

							<!-- Nominations -->
							<div>
								<div class="flex justify-between items-center mb-2">
									<h3 class="text-sm font-medium text-white/70">Nominations</h3>
									{#if isHost && nominations.length >= 2}
										<Button
											on:click={startVotingPhase}
											class="bg-[#E50914] hover:bg-[#B20710] text-white px-4 py-1.5 rounded-lg transition-all duration-300 text-sm flex items-center gap-2 hover:scale-105 hover:shadow-lg hover:shadow-[#E50914]/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
											disabled={loading || participants.length < 2}
										>
											{#if loading}
												<div class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
											{:else}
												<Trophy size={16} class="transform transition-transform group-hover:rotate-12" />
												{participants.length < 2 ? 'Waiting for players...' : 'Start Voting'}
											{/if}
										</Button>
									{/if}
								</div>
								{#if nominations.length > 0}
									<div id="nominations-section" class="space-y-2">
										{#each nominations as nomination}
											<div 
												class="p-3 rounded-lg bg-white/5 backdrop-blur-sm transform transition-all duration-300 hover:scale-[1.01] hover:bg-white/10" 
												transition:fly={{ y: 20 }}
											>
												<div class="flex justify-between items-start">
													<div>
														<h4 class="font-medium text-white">{nomination.movie.title}</h4>
														<p class="text-sm text-white/50">
															Nominated by {nomination.participant.nickname}
															{#if nomination.participant.id === participantId}
																<span class="opacity-50">(you)</span>
															{/if}
														</p>
													</div>
												</div>
											</div>
										{/each}
									</div>
								{:else}
									<p class="text-white/50 text-sm">No movies nominated yet</p>
								{/if}
							</div>

							<!-- Movie Search -->
							<div class="space-y-4">
								{#if !showRecommendationForm && !recommendations.length}
									<div class="flex flex-col items-center gap-4 p-6 rounded-lg bg-gradient-to-br from-[#E50914]/10 to-purple-900/20 backdrop-blur-sm text-center group hover:from-[#E50914]/20 hover:to-purple-900/30 transition-all duration-300">
										<div class="w-16 h-16 mb-2 transform transition-transform group-hover:scale-110 group-hover:rotate-12">
											<span class="text-5xl">🎥</span>
										</div>
										<p class="text-white/70">Time to pick something awesome!</p>
										<div class="flex gap-4">
											<Button
												id="find-movies-btn"
												on:click={() => {
													showRecommendationForm = true;
													setTimeout(() => {
														document.getElementById('recommendation-form')?.scrollIntoView({ 
															behavior: 'smooth',
															block: 'start'
														});
													}, 100);
												}}
												class="bg-gradient-to-r from-[#E50914] to-[#B20710] hover:from-[#B20710] hover:to-[#E50914] text-white px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 group"
												disabled={nominations.some(n => n.participant.id === participantId)}
											>
												<div class="flex items-center gap-2">
													<Film size={20} class="transform transition-transform group-hover:rotate-12" />
													<span>Discover Movies</span>
													<span class="text-xl inline-block transform transition-transform group-hover:rotate-12">✨</span>
												</div>
											</Button>
											<Button
												id="library-btn"
												on:click={handleLibraryClick}
												class="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 backdrop-blur-sm group"
												disabled={nominations.some(n => n.participant.id === participantId)}
											>
												<div class="flex items-center gap-2">
													<span>My Collection</span>
													<span class="text-xl inline-block transform transition-transform group-hover:rotate-12">📚</span>
												</div>
											</Button>
										</div>
									</div>
								{:else if showRecommendationForm}
									<div id="recommendation-form" class="p-6 rounded-lg bg-gradient-to-br from-[#E50914]/10 to-purple-900/20 backdrop-blur-sm">
										<div class="flex justify-between items-center mb-6">
											<div class="flex items-center gap-3">
												<Film size={24} class="text-[#E50914]" />
												<h3 class="text-xl font-medium text-white">Find Your Movie</h3>
											</div>
											<button
												on:click={() => {
													showRecommendationForm = false;
													recommendations = [];
												}}
												class="text-white/50 hover:text-white/70"
											>
												<X size={20} />
											</button>
										</div>
										<div class="max-w-xl mx-auto">
											<Form
												bind:loading
												on:submit={handleRecommendationSubmit}
											/>
										</div>
									</div>
								{/if}

								{#if recommendations.length > 0}
									<div class="space-y-4" transition:fade>
										<div class="flex justify-between items-center mb-4">
											<div class="flex items-center gap-3">
												<Trophy size={24} class="text-[#E50914]" />
												<h3 class="text-xl font-medium text-white">Here's What We Found</h3>
											</div>
											<div class="flex items-center gap-2">
												<button
													on:click={handleLibraryClick}
													class="text-white/50 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg flex items-center gap-2"
												>
													<Film size={20} />
													<span class="text-sm">Library</span>
												</button>
												<button
													on:click={() => {
														recommendations = [];
														showRecommendationForm = false;
													}}
													class="text-white/50 hover:text-white/70 transition-colors p-2 hover:bg-white/5 rounded-lg"
												>
													<X size={20} />
												</button>
											</div>
										</div>
										<div class="grid grid-cols-1 sm:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto pr-2 snap-y snap-mandatory">
											{#each recommendations as movie}
												<div 
													class="relative group rounded-lg overflow-hidden bg-gradient-to-br from-[#E50914]/10 to-purple-900/20 backdrop-blur-sm hover:from-[#E50914]/20 hover:to-purple-900/30 transition-all duration-300 hover:scale-[1.02] snap-start"
													style="aspect-ratio: 2/3;"
												>
													{#if movie.poster_path}
														<img
															src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
															alt={movie.title}
															class="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
														/>
													{/if}
													<div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
														<div class="absolute bottom-0 left-0 right-0 p-4">
															<div class="flex justify-between items-start">
																<div class="flex-1">
																	<h4 class="font-medium text-white text-lg mb-1 group-hover:text-white/90">{movie.title}</h4>
																	<p class="text-sm text-white/70 line-clamp-2 mb-2 group-hover:text-white/90">{movie.description}</p>
																	{#if movie.release_date}
																		<p class="text-sm text-white/50">{new Date(movie.release_date).getFullYear()}</p>
																	{/if}
																</div>
																<Button
																	on:click={() => nominateMovie(movie)}
																	class="ml-4 bg-gradient-to-r from-[#E50914] to-[#B20710] hover:from-[#B20710] hover:to-[#E50914] text-white px-3 py-1 rounded-lg transition-all duration-300 text-sm flex items-center gap-2 hover:scale-105"
																	disabled={nominations.some(n => n.participant.id === participantId) || loading}
																>
																	{#if loading}
																		<div class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
																	{:else}
																		<Trophy size={16} />
																		Pick This One
																	{/if}
																</Button>
															</div>
														</div>
													</div>
												</div>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	{/if}

	{#if showOnboarding}
		<div class="fixed inset-0 z-[100]">
			<div 
				class="absolute inset-0 bg-black/70" 
				transition:fade={{ duration: 200 }}
				on:click={stopOnboarding}
				role="button"
				tabindex="-1"
			/>
			{#key currentStep}
				{#if targetElement}
					<div
						class="tooltip"
						style="
							left: {getTargetPosition(onboardingSteps[currentStep].target)?.x}px;
							top: {getTargetPosition(onboardingSteps[currentStep].target)?.y + 20}px;
						"
						transition:fly={{ y: 20, duration: 200 }}
					>
						<div class="flex items-start gap-4">
							<div class="flex-shrink-0 w-8 h-8 rounded-full bg-[#E50914] text-white flex items-center justify-center font-medium">
								{currentStep + 1}
							</div>
							<p class="flex-1 text-lg text-gray-800 pt-1">{onboardingSteps[currentStep].content}</p>
						</div>
						<div class="flex justify-between items-center mt-6">
							<div class="flex items-center gap-3">
								<button
									class="px-3 py-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
									on:click={() => currentStep > 0 && currentStep--}
									disabled={currentStep === 0}
								>
									Back
								</button>
								<div class="flex gap-1.5">
									{#each onboardingSteps as _, i}
										<div
											class="w-2.5 h-2.5 rounded-full transition-colors duration-300 cursor-pointer"
											class:bg-[#E50914]={i === currentStep}
											class:bg-gray-200={i !== currentStep}
											on:click={() => currentStep = i}
											role="button"
											tabindex="0"
										/>
									{/each}
								</div>
							</div>
							<div class="flex gap-3">
								<button
									class="px-3 py-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
									on:click={stopOnboarding}
								>
									Skip
								</button>
								<button
									class="bg-[#E50914] text-white px-5 py-1.5 rounded-lg hover:bg-[#B20710] transition-all duration-300 hover:scale-105"
									on:click={nextStep}
								>
									{currentStep === onboardingSteps.length - 1 ? 'Got it!' : 'Next'}
								</button>
							</div>
						</div>
					</div>
				{/if}
			{/key}
		</div>
	{/if}
</div>

<style>
	:global(body) {
		@apply bg-[#0f0f0f];
	}
	.voted-border {
		@apply border-2 border-[#E50914];
	}
	.voted-ring {
		@apply ring-2 ring-[#E50914]/20;
	}
	.hover-bg {
		@apply hover:bg-white/10;
	}
	.default-border {
		@apply border border-white/10;
	}
	.hover-scale {
		@apply hover:scale-[1.02];
	}

	@keyframes pulse {
		0% {
			box-shadow: 0 0 0 0 rgba(229, 9, 20, 0.8);
			transform: scale(1);
		}
		70% {
			box-shadow: 0 0 0 20px rgba(229, 9, 20, 0);
			transform: scale(1.05);
		}
		100% {
			box-shadow: 0 0 0 0 rgba(229, 9, 20, 0);
			transform: scale(1);
		}
	}

	:global(.pulse-effect) {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
		position: relative;
		z-index: 60 !important;
	}

	:global(.pulse-effect::before) {
		content: '';
		position: absolute;
		inset: -4px;
		border-radius: inherit;
		background: rgba(229, 9, 20, 0.1);
		z-index: -1;
	}

	.tooltip {
		position: absolute;
		background: white;
		padding: 1.5rem;
		border-radius: 1rem;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		z-index: 100;
		max-width: 24rem;
		transform: translateX(-50%);
		border: 2px solid rgba(229, 9, 20, 0.1);
	}

	.tooltip::before {
		content: '';
		position: absolute;
		top: -10px;
		left: 50%;
		transform: translateX(-50%);
		border-width: 0 10px 10px 10px;
		border-style: solid;
		border-color: transparent transparent white transparent;
	}

	/* Add fluid background */
	:global(body::before) {
		content: '';
		position: fixed;
		inset: 0;
		background: 
			radial-gradient(circle at 50% 0%, rgba(229, 9, 20, 0.15), transparent 70%),
			radial-gradient(circle at 100% 50%, rgba(229, 9, 20, 0.1), transparent 50%),
			radial-gradient(circle at 0% 100%, rgba(103, 58, 183, 0.1), transparent 50%);
		background-size: 200% 200%;
		animation: moveGradient 30s ease infinite;
		z-index: -1;
		opacity: 0.7;
	}

	@keyframes moveGradient {
		0%, 100% { background-position: 0% 0%; }
		25% { background-position: 100% 0%; }
		50% { background-position: 100% 100%; }
		75% { background-position: 0% 100%; }
	}
</style> 