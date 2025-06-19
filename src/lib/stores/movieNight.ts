import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export interface Participant {
  id: string;
  nickname: string;
  isHost: boolean;
  isReady: boolean;
  hasNominated: boolean;
  hasVoted: boolean;
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
  ws: WebSocket | null;
  connected: boolean;
  room: MovieNightRoom | null;
  currentUser: {
    id: string;
    nickname: string;
    isHost: boolean;
  } | null;
  error: string | null;
  reconnectAttempts: number;
}

// Create the store
function createMovieNightStore() {
  const { subscribe, set, update } = writable<MovieNightState>({
    ws: null,
    connected: false,
    room: null,
    currentUser: null,
    error: null,
    reconnectAttempts: 0
  });

  let reconnectTimeout: ReturnType<typeof setTimeout>;
  let pingInterval: ReturnType<typeof setInterval>;

  function connect(roomCode: string, userId: string, nickname: string, isHost: boolean) {
    if (!browser) return;

    // Close existing connection if any
    disconnect();

    // Use secure WebSocket in production
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/movie-night/ws`);

    ws.onopen = () => {
      console.log('WebSocket connected');
      update(state => ({ ...state, ws, connected: true, error: null, reconnectAttempts: 0 }));

      // Send join message
      ws.send(JSON.stringify({
        type: 'join',
        roomCode,
        userId,
        nickname,
        isHost
      }));

      // Start ping interval to keep connection alive
      pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      update(state => ({ ...state, error: 'Connection error' }));
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
      update(state => ({ ...state, ws: null, connected: false }));
      
      // Clear ping interval
      if (pingInterval) clearInterval(pingInterval);

      // Attempt to reconnect
      update(state => {
        if (state.reconnectAttempts < 5) {
          reconnectTimeout = setTimeout(() => {
            connect(roomCode, userId, nickname, isHost);
          }, Math.min(1000 * Math.pow(2, state.reconnectAttempts), 10000));
          
          return { ...state, reconnectAttempts: state.reconnectAttempts + 1 };
        }
        return { ...state, error: 'Connection lost. Please refresh the page.' };
      });
    };
  }

  function disconnect() {
    update(state => {
      if (state.ws) {
        state.ws.close();
      }
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (pingInterval) clearInterval(pingInterval);
      
      return {
        ws: null,
        connected: false,
        room: null,
        currentUser: null,
        error: null,
        reconnectAttempts: 0
      };
    });
  }

  function handleMessage(data: any) {
    switch (data.type) {
      case 'room_update':
        update(state => ({ ...state, room: data.room }));
        break;
        
      case 'user_joined':
        update(state => {
          if (!state.room) return state;
          return {
            ...state,
            room: {
              ...state.room,
              participants: [...state.room.participants, data.participant],
              updatedAt: Date.now()
            }
          };
        });
        break;
        
      case 'user_left':
        update(state => {
          if (!state.room) return state;
          return {
            ...state,
            room: {
              ...state.room,
              participants: state.room.participants.filter(p => p.id !== data.participantId),
              updatedAt: Date.now()
            }
          };
        });
        break;
        
      case 'phase_changed':
        update(state => {
          if (!state.room) return state;
          return {
            ...state,
            room: {
              ...state.room,
              phase: data.phase,
              updatedAt: Date.now()
            }
          };
        });
        break;
        
      case 'movie_nominated':
        update(state => {
          if (!state.room) return state;
          return {
            ...state,
            room: {
              ...state.room,
              nominations: [...state.room.nominations, data.movie],
              participants: state.room.participants.map(p => 
                p.id === data.participantId ? { ...p, hasNominated: true } : p
              ),
              updatedAt: Date.now()
            }
          };
        });
        break;
        
      case 'vote_cast':
        update(state => {
          if (!state.room) return state;
          return {
            ...state,
            room: {
              ...state.room,
              nominations: state.room.nominations.map(movie => 
                movie.id === data.movieId 
                  ? { ...movie, votes: [...movie.votes, data.participantId] }
                  : movie
              ),
              participants: state.room.participants.map(p => 
                p.id === data.participantId ? { ...p, hasVoted: true } : p
              ),
              updatedAt: Date.now()
            }
          };
        });
        break;
        
      case 'winner_revealed':
        update(state => {
          if (!state.room) return state;
          return {
            ...state,
            room: {
              ...state.room,
              phase: 'complete',
              winner: data.winner,
              updatedAt: Date.now()
            }
          };
        });
        break;
        
      case 'error':
        update(state => ({ ...state, error: data.message }));
        break;
        
      case 'pong':
        // Server acknowledged our ping
        break;
        
      default:
        console.warn('Unknown message type:', data.type);
    }
  }

  function sendMessage(message: any) {
    const state = get();
    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      state.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected');
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
    sendMessage,
    // Action methods
    startNominations: () => sendMessage({ type: 'start_nominations' }),
    nominateMovie: (movie: Omit<Movie, 'id' | 'nominatedBy' | 'votes'>) => 
      sendMessage({ type: 'nominate_movie', movie }),
    markReady: () => sendMessage({ type: 'mark_ready' }),
    startVoting: () => sendMessage({ type: 'start_voting' }),
    vote: (movieId: string) => sendMessage({ type: 'vote', movieId }),
    revealWinner: () => sendMessage({ type: 'reveal_winner' })
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
export const allReady = derived(movieNightStore, $store => 
  $store.room?.participants.every(p => p.isReady || p.isHost) || false
);
export const allNominated = derived(movieNightStore, $store => 
  $store.room?.participants.every(p => p.hasNominated) || false
);
export const allVoted = derived(movieNightStore, $store => 
  $store.room?.participants.every(p => p.hasVoted) || false
); 