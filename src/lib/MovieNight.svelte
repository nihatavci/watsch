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

	interface Participant {
		id: string;
		nickname: string;
	}

	interface Movie {
		id: string;
		title: string;
		description: string;
		poster_path?: string;
		release_date?: string;
	}

	interface Vote {
		participant: Participant;
		movie: Movie;
	}

	let roomCode = '';
	let nickname = '';
	let isHost = false;
	let roomPhase: 'join' | 'nominate' | 'vote' | 'results' = 'join';
	let participants: Participant[] = [];
	let nominations: { participant: Participant; movie: Movie }[] = [];
	let votes: Vote[] = [];
	let isCopying = false;
	let participantId: string | null = null;
	let loading = false;
	let recommendations: Movie[] = [];
	let showRecommendationForm = false;
	let cinemaType = 'movie';
	let selectedCategories: string[] = [];
	let selectedPlatforms: string[] = [];
	let specificDescriptors = '';

	$: console.log('Current state:', { roomPhase, isHost, participants });

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

	async function startVotingPhase() {
		loading = true;
		try {
			const response = await fetch('/api/room/phase', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					roomCode,
					phase: 'vote'
				})
			});

			if (!response.ok) {
				throw new Error('Failed to start voting phase');
			}

			const data = await response.json();
			roomPhase = 'vote';
		} catch (error) {
			console.error('Error starting voting phase:', error);
		} finally {
			loading = false;
		}
	}

	async function createRoom() {
		loading = true;
		try {
			const response = await fetch('/api/movie-night/create-room', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					hostNickname: nickname
				})
			});

			if (!response.ok) {
				throw new Error('Failed to create room');
			}

			const data = await response.json();
			roomCode = data.roomCode;
			participantId = data.hostId;
			isHost = true;
			roomPhase = 'nominate';
		} catch (error) {
			console.error('Error creating room:', error);
		} finally {
			loading = false;
		}
	}

	async function joinRoom() {
		loading = true;
		try {
			const response = await fetch('/api/movie-night/join-room', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					roomCode,
					nickname
				})
			});

			if (!response.ok) {
				throw new Error('Failed to join room');
			}

			const data = await response.json();
			participantId = data.participantId;
			participants = data.participants;
			nominations = data.nominations;
			roomPhase = data.phase;
		} catch (error) {
			console.error('Error joining room:', error);
		} finally {
			loading = false;
		}
	}

	async function leaveRoom() {
		loading = true;
		try {
			const response = await fetch('/api/room/leave', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					roomCode,
					participantId
				})
			});

			if (!response.ok) {
				throw new Error('Failed to leave room');
			}

			roomCode = '';
			nickname = '';
			isHost = false;
			roomPhase = 'join';
			participants = [];
			nominations = [];
			votes = [];
			participantId = null;
		} catch (error) {
			console.error('Error leaving room:', error);
		} finally {
			loading = false;
		}
	}

	async function copyRoomCode() {
		if (isCopying) return;
		isCopying = true;
		try {
			await navigator.clipboard.writeText(roomCode);
			setTimeout(() => {
				isCopying = false;
			}, 2000);
		} catch (error) {
			console.error('Error copying room code:', error);
			isCopying = false;
		}
	}

	async function voteForMovie(movie: Movie) {
		loading = true;
		try {
			const response = await fetch('/api/vote', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					roomCode,
					movieId: movie.id
				})
			});

			if (!response.ok) {
				throw new Error('Failed to vote');
			}

			const data = await response.json();
			votes = data.votes;
		} catch (error) {
			console.error('Error voting:', error);
		} finally {
			loading = false;
		}
	}

	async function showResults() {
		loading = true;
		try {
			const response = await fetch('/api/results', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					roomCode
				})
			});

			if (!response.ok) {
				throw new Error('Failed to show results');
			}

			const data = await response.json();
			roomPhase = 'results';
		} catch (error) {
			console.error('Error showing results:', error);
		} finally {
			loading = false;
		}
	}

	async function getRecommendations(prompt: string) {
		console.log('Original prompt from Form:', prompt); // Log the original prompt
		loading = true;
		try {
			// Ensure cinemaType is set
			if (!cinemaType) {
				console.error('cinemaType is not set!');
				cinemaType = 'movie'; // Set a default value
			}

			// Reconstruct the prompt if necessary, with added safeguards
			let reconstructedPrompt = `Give me a list of 5 ${cinemaType} recommendations`;
			if (selectedCategories.length > 0) {
				reconstructedPrompt += ` that fit these categories: ${selectedCategories.join(', ')}`;
			} else {
				reconstructedPrompt += ` that fit these categories: Any`; // Default to 'Any' if no categories are selected
			}
			if (selectedPlatforms.length > 0) {
				reconstructedPrompt += ` available on ${selectedPlatforms.join(' or ')}`;
			}
			if (specificDescriptors) {
				reconstructedPrompt += `. Additional preferences: ${specificDescriptors}`;
			} else {
				reconstructedPrompt += `. Additional preferences: None`; // Explicitly state no preferences
			}
			reconstructedPrompt += `. Please return this response as a numbered list with the ${cinemaType}'s title, followed by a colon, and then a brief description.`;

			console.log('Reconstructed prompt:', reconstructedPrompt); // Log the reconstructed prompt

			const response = await fetch('/api/getRecommendation', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					query: reconstructedPrompt,
					mediaType: cinemaType || 'movie',
					genres: selectedCategories,
					platforms: selectedPlatforms
				})
			});

			if (!response.ok) {
				throw new Error('Failed to get recommendations');
			}

			const data = await response.json();
			console.log('Recommendations response:', data);

			// Process recommendations and fetch movie details
			const recommendationsWithDetails = await Promise.all(
				data.recommendations.map(async (rec: string) => {
					const match = rec.match(/\d+\.\s*(.*?):\s*(.*)/);
					if (!match) return null;
					const [, title, description] = match;

					try {
						// Fetch movie details from TMDB
						const searchResponse = await fetch(`/api/tmdb/search`, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json'
							},
							body: JSON.stringify({
								title: title.trim(),
								type: 'movie'
							})
						});

						const searchData = await searchResponse.json();
						const movieResult = searchData.results?.[0];

						if (!movieResult) {
							return {
								id: Date.now().toString(),
								title,
								description,
								poster_path: null,
								release_date: null
							};
						}

						return {
							id: movieResult.id.toString(),
							title,
							description,
							poster_path: movieResult.poster_path,
							release_date: movieResult.release_date
						};
					} catch (error) {
						console.error('Error fetching movie details:', error);
						return {
							id: Date.now().toString(),
							title,
							description,
							poster_path: null,
							release_date: null
						};
					}
				})
			);

			recommendations = recommendationsWithDetails.filter((rec): rec is Movie => rec !== null);
			console.log('Processed recommendations:', recommendations);
		} catch (error) {
			console.error('Error getting recommendations:', error);
			showNotification($i18nStore.t('recommendations.error.partial'));
		} finally {
			loading = false;
		}
	}

	async function nominateMovie(movie: Movie) {
		loading = true;
		try {
			const response = await fetch('/api/movie-night/nominate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					roomCode,
					nickname,
					movie
				})
			});

			if (!response.ok) {
				throw new Error('Failed to nominate movie');
			}

			const data = await response.json();
			nominations = data.nominations;
			showRecommendationForm = false;
			recommendations = [];
			showNotification($i18nStore.t('movie_night.nominated', { title: movie.title }));
		} catch (error) {
			console.error('Error nominating movie:', error);
			showNotification($i18nStore.t('movie_night.nomination_failed'), 'error');
		} finally {
			loading = false;
		}
	}

	function handleLibraryClick() {
		sidebar.update((state) => ({ ...state, view: 'library' }));
	}

	$: {
		if (roomCode && nickname && participantId) {
			// Update global state
			globalRoomPhase = roomPhase;
			globalRoomCode = roomCode;
			globalParticipants = participants;
		}
	}

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

<!-- Join Screen -->
<div class="min-h-screen flex flex-col items-center justify-center py-8">
	<div class="text-center mb-8">
		<h1
			class="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight flex items-center justify-center gap-2"
		>
			<span class="text-4xl">🍿</span>
			Movie Night Fun!
		</h1>
		<p class="text-lg text-white/70">Grab your snacks and join the movie party!</p>
		<button class="mt-4 text-white/90 hover:text-white flex items-center gap-2 mx-auto">
			<span>How does this work?</span>
			<span class="text-xl">🤔</span>
		</button>
	</div>

	<div class="w-full max-w-xl mx-auto px-4">
		<Card class="bg-[#0f0f0f] border border-[#E50914]/20">
			<CardContent class="p-8">
				<div class="flex flex-col items-center mb-8">
					<div class="w-16 h-16 mb-4">
						<span class="text-5xl">🎬</span>
					</div>
					<h2 class="text-2xl font-bold text-white mb-2">Join the Fun!</h2>
					<p class="text-white/70">Create a room or hop into an existing one</p>
				</div>

				<div class="space-y-6">
					<div>
						<label class="flex items-center gap-2 text-white mb-2">
							<span>Your Movie Star Name</span>
							<span class="text-[#E50914]">*</span>
							<span>⭐️</span>
						</label>
						<input
							type="text"
							bind:value={nickname}
							class="w-full px-4 py-3 rounded-lg bg-black/30 border-2 border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#E50914]/50 transition-all"
							placeholder="This is required to join the fun!"
						/>
					</div>

					<div class="flex flex-col sm:flex-row gap-4">
						<Button
							on:click={createRoom}
							disabled={!nickname.trim() || loading}
							class="flex-1 bg-[#E50914] hover:bg-[#B20710] text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
						>
							<span class="text-lg">{loading ? 'Creating...' : 'Start the Party!'}</span>
							{#if loading}
								<div
									class="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"
								/>
							{:else}
								<span class="text-xl">🎉</span>
							{/if}
						</Button>

						<div class="flex-1 space-y-2">
							<input
								type="text"
								bind:value={roomCode}
								class="w-full px-4 py-3 rounded-lg bg-black/30 border-2 border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#E50914]/50 transition-all"
								placeholder="Got a room code?"
							/>
							<Button
								on:click={joinRoom}
								disabled={!nickname.trim() || !roomCode.trim() || loading}
								class="w-full bg-black/30 hover:bg-black/50 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
							>
								<span class="text-lg">{loading ? 'Joining...' : 'Join In!'}</span>
								{#if loading}
									<div
										class="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"
									/>
								{:else}
									<span class="text-xl">🎉</span>
								{/if}
							</Button>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	</div>
</div>

<!-- Nomination Screen -->
{#if roomPhase !== 'join'}
	<div class="fixed inset-0 z-50 overflow-y-auto bg-black/90">
		<div class="min-h-full flex items-center justify-center p-4 py-12">
			<div class="w-full max-w-2xl relative">
				<Card class="bg-[#0f0f0f] border border-neutral-800 shadow-2xl">
					<CardContent class="p-8">
						<!-- Room Info -->
						<div class="flex items-center justify-between mb-6">
							<div class="flex items-center gap-4">
								<div class="flex items-center gap-2 text-white/70">
									<span>Room:</span>
									<code class="bg-black/30 px-3 py-1 rounded-lg text-sm">{roomCode}</code>
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
									<span>{participants.length} Players</span>
								</div>
							</div>
							<Button
								on:click={leaveRoom}
								class="bg-black/30 hover:bg-black/50 text-white px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-2"
							>
								<X size={16} />
								<span>Leave Room</span>
							</Button>
						</div>

						<!-- Participants -->
						<div class="mb-6">
							<h3 class="text-sm font-medium text-white/70 mb-3">Participants</h3>
							<div class="flex flex-wrap gap-2">
								{#each participants as participant}
									<div class="px-3 py-1.5 rounded-full bg-black/30 text-white/90 text-sm">
										{participant.nickname}
										{#if participant.id === participantId}
											<span class="ml-1 opacity-50">(you)</span>
										{/if}
									</div>
								{/each}
							</div>
						</div>

						<!-- Nominations -->
						<div class="mb-6">
							<div class="flex justify-between items-center mb-3">
								<h3 class="text-sm font-medium text-white/70">Nominations</h3>
								{#if isHost && nominations.length >= 2}
									<Button
										on:click={startVotingPhase}
										class="bg-[#E50914] hover:bg-[#B20710] text-white px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
										disabled={loading || participants.length < 2}
									>
										{#if loading}
											<div
												class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"
											/>
										{:else}
											<Trophy size={16} />
											{participants.length < 2 ? 'Waiting for players...' : 'Start Voting'}
										{/if}
									</Button>
								{/if}
							</div>
							{#if nominations.length > 0}
								<div class="space-y-2">
									{#each nominations as nomination}
										<div class="p-4 rounded-lg bg-black/30 text-white">
											<h4 class="font-medium mb-1">{nomination.movie.title}</h4>
											<p class="text-sm text-white/50">
												Nominated by {nomination.participant.nickname}
												{#if nomination.participant.id === participantId}
													<span class="opacity-50">(you)</span>
												{/if}
											</p>
										</div>
									{/each}
								</div>
							{:else}
								<p class="text-white/50 text-sm">No movies nominated yet</p>
							{/if}
						</div>

						<!-- Movie Search -->
						{#if !nominations.some((n) => n.participant.id === participantId)}
							<div class="text-center p-6 bg-black/30 rounded-lg">
								<div class="w-16 h-16 mx-auto mb-4">
									<span class="text-4xl">🎬</span>
								</div>
								<p class="text-white/70 mb-4">Time to pick a movie!</p>
								<div class="flex justify-center gap-4">
									<Button
										on:click={() => (showRecommendationForm = true)}
										class="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
										disabled={loading ||
											nominations.some((n) => n.participant.id === participantId)}
									>
										<Film size={20} />
										<span>Find Movies</span>
									</Button>
									<Button
										on:click={handleLibraryClick}
										class="w-full bg-black/30 hover:bg-black/50 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
									>
										<span>My Collection</span>
									</Button>
								</div>
							</div>
						{/if}

						{#if showRecommendationForm}
							<div class="mt-6">
								<div class="flex justify-between items-center mb-4">
									<h3 class="text-xl font-medium text-white">Find Your Movie</h3>
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
								<Form
									on:submit={getRecommendations}
									on:close={() => {
										showRecommendationForm = false;
										recommendations = [];
									}}
								/>
							</div>
						{/if}

						{#if recommendations.length > 0}
							<div class="mt-6">
								<div class="flex justify-between items-center mb-4">
									<h3 class="text-xl font-medium text-white">Here's What We Found</h3>
									<button
										on:click={() => {
											recommendations = [];
											showRecommendationForm = false;
										}}
										class="text-white/50 hover:text-white/70"
									>
										<X size={20} />
									</button>
								</div>
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
									{#each recommendations as movie}
										<div class="relative rounded-lg overflow-hidden bg-black/30">
											{#if movie.poster_path}
												<img
													src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
													alt={movie.title}
													class="w-full aspect-[2/3] object-cover opacity-60"
												/>
											{/if}
											<div
												class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"
											>
												<div class="absolute bottom-0 left-0 right-0 p-4">
													<h4 class="font-medium text-white text-lg mb-1">{movie.title}</h4>
													<p class="text-sm text-white/70 line-clamp-2 mb-2">{movie.description}</p>
													{#if movie.release_date}
														<p class="text-sm text-white/50">
															{new Date(movie.release_date).getFullYear()}
														</p>
													{/if}
													<Button
														on:click={() => nominateMovie(movie)}
														class="mt-3 w-full bg-[#E50914] hover:bg-[#B20710] active:bg-[#8B0000] text-white px-3 py-2 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
														disabled={loading}
													>
														{#if loading}
															<div
																class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"
															/>
														{:else}
															<Trophy
																size={16}
																class="transform group-hover:scale-110 transition-transform"
															/>
															<span>Pick This One</span>
														{/if}
													</Button>
												</div>
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</CardContent>
				</Card>
			</div>
		</div>
	</div>
{/if}

<!-- Voting Screen -->
{#if roomPhase === 'vote'}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
		<div class="w-full max-w-2xl">
			<Card class="bg-[#0f0f0f] border border-[#E50914]/20">
				<CardContent class="p-6">
					<!-- Room Info -->
					<div class="flex items-center justify-between mb-6">
						<div class="flex items-center gap-4">
							<div class="flex items-center gap-2 text-white/70">
								<span>Room:</span>
								<code class="bg-black/30 px-3 py-1 rounded-lg text-sm">{roomCode}</code>
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
								<span>{participants.length} Players</span>
							</div>
						</div>
						<Button
							on:click={leaveRoom}
							class="bg-black/30 hover:bg-black/50 text-white px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-2"
						>
							<X size={16} />
							<span>Leave Room</span>
						</Button>
					</div>

					<!-- Voting -->
					<div class="mb-6">
						<div class="flex justify-between items-center mb-3">
							<h3 class="text-sm font-medium text-white/70">Vote for Your Favorite</h3>
							{#if isHost && votes.length === participants.length}
								<Button
									on:click={showResults}
									class="bg-[#E50914] hover:bg-[#B20710] text-white px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2"
									disabled={loading}
								>
									{#if loading}
										<div
											class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"
										/>
									{:else}
										<Trophy size={16} />
										<span>Show Results</span>
									{/if}
								</Button>
							{/if}
						</div>
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{#each nominations as nomination}
								<div class="relative rounded-lg overflow-hidden bg-black/30">
									{#if nomination.movie.poster_path}
										<img
											src={`https://image.tmdb.org/t/p/w500${nomination.movie.poster_path}`}
											alt={nomination.movie.title}
											class="w-full aspect-[2/3] object-cover opacity-60"
										/>
									{/if}
									<div
										class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"
									>
										<div class="absolute bottom-0 left-0 right-0 p-4">
											<h4 class="font-medium text-white text-lg mb-1">{nomination.movie.title}</h4>
											<p class="text-sm text-white/70 line-clamp-2 mb-2">
												{nomination.movie.description}
											</p>
											{#if nomination.movie.release_date}
												<p class="text-sm text-white/50">
													{new Date(nomination.movie.release_date).getFullYear()}
												</p>
											{/if}
											<Button
												on:click={() => voteForMovie(nomination.movie)}
												class="mt-3 w-full bg-[#E50914] hover:bg-[#B20710] text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
												disabled={loading || votes.some((v) => v.participant.id === participantId)}
											>
												{#if loading}
													<div
														class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"
													/>
												{:else}
													<Trophy size={16} />
													<span>Vote</span>
												{/if}
											</Button>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>

					<!-- Voting Status -->
					<div>
						<h3 class="text-sm font-medium text-white/70 mb-3">Votes</h3>
						<div class="flex flex-wrap gap-2">
							{#each participants as participant}
								<div
									class="px-3 py-1.5 rounded-full text-sm {votes.some(
										(v) => v.participant.id === participant.id
									)
										? 'bg-[#E50914]/20 text-[#E50914]'
										: 'bg-black/30 text-white/90'}"
								>
									{participant.nickname}
									{#if participant.id === participantId}
										<span class="ml-1 opacity-50">(you)</span>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	</div>
{/if}
