import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export interface Participant {
  id: string;
  nickname: string;
  isHost: boolean;
  isReady: boolean;
  hasNominated: boolean;
  hasVoted: boolean;
  joinedAt: number;
}

export interface Movie {
  id: string;
  tmdbId: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  media_type: 'movie' | 'tv';
  nominatedBy: string;
  nominatedByNickname: string;
  votes: string[]; // participant IDs who voted
}

export interface MovieNightRoom {
  code: string;
  hostId: string;
  phase: 'waiting' | 'nominating' | 'voting' | 'reveal' | 'complete';
  participants: Participant[];
  nominations: Movie[];
  winner: Movie | null;
  createdAt: number;
  updatedAt: number;
}

interface MovieNightState {
  eventSource: EventSource | null;
  connected: boolean;
  room: MovieNightRoom | null;
  currentUser: {
    id: string;
    nickname: string;
    isHost: boolean;
  } | null;
  error: string | null;
  loading: boolean;
}

// Create the store
function createMovieNightStore() {
  const { subscribe, set, update } = writable<MovieNightState>({
    eventSource: null,
    connected: false,
    room: null,
    currentUser: null,
    error: null,
    loading: false
  });

  let pollInterval: ReturnType<typeof setInterval>;

  async function connect(roomCode: string, userId: string, nickname: string, isHost: boolean) {
    if (!browser) return;

    // Close existing connection if any
    disconnect();

    update(state => ({ ...state, loading: true, error: null }));

    // Store current user info
    update(state => ({
      ...state,
      currentUser: { id: userId, nickname, isHost }
    }));

    // Join room first
    try {
      const response = await fetch('/api/movie-night/join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, userId, nickname, isHost })
      });

      if (!response.ok) {
        throw new Error('Failed to join room');
      }

      const roomData = await response.json();
      update(state => ({ ...state, room: roomData }));
    } catch (err) {
      update(state => ({ 
        ...state, 
        error: err instanceof Error ? err.message : 'Failed to connect',
        loading: false 
      }));
      return;
    }

    // Set up SSE connection for real-time updates
    const eventSource = new EventSource(`/api/movie-night/events?roomCode=${roomCode}&userId=${userId}`);

    eventSource.onopen = () => {
      console.log('SSE connected');
      update(state => ({ ...state, eventSource, connected: true, loading: false }));
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch (err) {
        console.error('Error parsing SSE message:', err);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      update(state => ({ ...state, connected: false, error: 'Connection lost' }));
      
      // Reconnect after a delay
      setTimeout(() => {
        if (eventSource.readyState === EventSource.CLOSED) {
          connect(roomCode, userId, nickname, isHost);
        }
      }, 3000);
    };

    // Also poll for updates as fallback (every 8 seconds to reduce disruption)
    pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/movie-night/room-status?code=${roomCode}`);
        if (response.ok) {
          const roomData = await response.json();
          // Only update if data has actually changed
          update(state => {
            if (!state.room || JSON.stringify(state.room) !== JSON.stringify(roomData)) {
              return { ...state, room: roomData };
            }
            return state;
          });
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 8000); // Increased from 2000ms to 8000ms to reduce polling frequency
  }

  function disconnect() {
    update(state => {
      if (state.eventSource) {
        state.eventSource.close();
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      
      return {
        eventSource: null,
        connected: false,
        room: null,
        currentUser: null,
        error: null,
        loading: false
      };
    });
  }

  function handleMessage(data: any) {
    switch (data.type) {
      case 'room_update':
        update(state => ({ ...state, room: data.room }));
        break;
        
      case 'phase_changed':
        update(state => {
          if (!state.room) return state;
          return {
            ...state,
            room: { ...state.room, phase: data.phase, updatedAt: Date.now() }
          };
        });
        break;
        
      case 'participant_joined':
      case 'participant_updated':
      case 'nomination_added':
      case 'vote_cast':
      case 'winner_revealed':
        // Fetch fresh room data
        fetchRoomStatus();
        break;
        
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  async function fetchRoomStatus() {
    const state = get();
    if (!state.room) return;

    try {
      const response = await fetch(`/api/movie-night/room-status?code=${state.room.code}`);
      if (response.ok) {
        const roomData = await response.json();
        update(s => ({ ...s, room: roomData }));
      }
    } catch (err) {
      console.error('Failed to fetch room status:', err);
    }
  }

  // Action methods
  async function startNominations() {
    const state = get();
    if (!state.room || !state.currentUser?.isHost) return;

    try {
      const response = await fetch('/api/movie-night/start-nominations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: state.room.code })
      });

      if (!response.ok) throw new Error('Failed to start nominations');
      await fetchRoomStatus();
    } catch (err) {
      update(s => ({ ...s, error: 'Failed to start nominations' }));
    }
  }

  async function nominateMovie(movie: Omit<Movie, 'id' | 'nominatedBy' | 'nominatedByNickname' | 'votes'>) {
    const state = get();
    if (!state.room || !state.currentUser) return;

    try {
      const response = await fetch('/api/movie-night/nominate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: state.room.code,
          userId: state.currentUser.id,
          nickname: state.currentUser.nickname,
          movie
        })
      });

      if (!response.ok) throw new Error('Failed to nominate movie');
      await fetchRoomStatus();
    } catch (err) {
      update(s => ({ ...s, error: 'Failed to nominate movie' }));
    }
  }

  async function markReady() {
    const state = get();
    if (!state.room || !state.currentUser) return;

    try {
      const response = await fetch('/api/movie-night/mark-ready', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: state.room.code,
          userId: state.currentUser.id
        })
      });

      if (!response.ok) throw new Error('Failed to mark ready');
      await fetchRoomStatus();
    } catch (err) {
      update(s => ({ ...s, error: 'Failed to mark ready' }));
    }
  }

  async function startVoting() {
    const state = get();
    if (!state.room || !state.currentUser?.isHost) return;

    try {
      const response = await fetch('/api/movie-night/start-voting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: state.room.code })
      });

      if (!response.ok) throw new Error('Failed to start voting');
      await fetchRoomStatus();
    } catch (err) {
      update(s => ({ ...s, error: 'Failed to start voting' }));
    }
  }

  async function vote(movieId: string) {
    const state = get();
    if (!state.room || !state.currentUser) return;

    try {
      const response = await fetch('/api/movie-night/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: state.room.code,
          userId: state.currentUser.id,
          movieId
        })
      });

      if (!response.ok) throw new Error('Failed to vote');
      await fetchRoomStatus();
    } catch (err) {
      update(s => ({ ...s, error: 'Failed to vote' }));
    }
  }

  async function finishVoting() {
    const state = get();
    if (!state.room || !state.currentUser?.isHost) return;

    try {
      const response = await fetch('/api/movie-night/finish-voting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: state.room.code })
      });

      if (!response.ok) throw new Error('Failed to finish voting');
      await fetchRoomStatus();
    } catch (err) {
      update(s => ({ ...s, error: 'Failed to finish voting' }));
    }
  }

  // Helper function to get current state
  let get: () => MovieNightState;
  subscribe((value) => {
    get = () => value;
  });

  return {
    subscribe,
    connect,
    disconnect,
    startNominations,
    nominateMovie,
    markReady,
    startVoting,
    vote,
    finishVoting,
    refresh: fetchRoomStatus
  };
}

export const movieNightStore = createMovieNightStore();

// Derived stores for convenience
export const isConnected = derived(movieNightStore, $store => $store.connected);
export const currentRoom = derived(movieNightStore, $store => $store.room);
export const currentUser = derived(movieNightStore, $store => $store.currentUser);
export const roomPhase = derived(movieNightStore, $store => $store.room?.phase || 'waiting');
export const participants = derived(movieNightStore, $store => $store.room?.participants || []);
export const nominations = derived(movieNightStore, $store => $store.room?.nominations || []);
export const winner = derived(movieNightStore, $store => $store.room?.winner);
export const isHost = derived(movieNightStore, $store => $store.currentUser?.isHost || false);
export const isLoading = derived(movieNightStore, $store => $store.loading);
export const error = derived(movieNightStore, $store => $store.error);

export const allReady = derived(movieNightStore, $store => 
  $store.room?.participants.filter(p => !p.isHost).every(p => p.isReady) || false
);

export const allNominated = derived(movieNightStore, $store => 
  $store.room?.participants.every(p => p.hasNominated) || false
);

export const allVoted = derived(movieNightStore, $store => 
  $store.room?.participants.every(p => p.hasVoted) || false
);

export const myNomination = derived(movieNightStore, $store => 
  $store.room?.nominations.find(n => n.nominatedBy === $store.currentUser?.id)
);

export const myVote = derived(movieNightStore, $store => 
  $store.room?.nominations.find(n => n.votes.includes($store.currentUser?.id || ''))
); 