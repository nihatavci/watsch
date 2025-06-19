import type { RequestHandler } from '@sveltejs/kit';
import { dev } from '$app/environment';

// Store for active rooms and connections
interface Room {
  code: string;
  hostId: string;
  phase: 'waiting' | 'nominating' | 'voting' | 'reveal' | 'complete';
  participants: Map<string, {
    id: string;
    nickname: string;
    isHost: boolean;
    isReady: boolean;
    hasNominated: boolean;
    hasVoted: boolean;
    ws: WebSocket;
  }>;
  nominations: Map<string, {
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
    votes: Set<string>;
  }>;
  winner: any;
  createdAt: number;
  updatedAt: number;
}

// In production, use Redis or similar for distributed storage
const rooms = new Map<string, Room>();

// Cleanup old rooms after 6 hours
setInterval(() => {
  const sixHoursAgo = Date.now() - (6 * 60 * 60 * 1000);
  for (const [code, room] of rooms.entries()) {
    if (room.updatedAt < sixHoursAgo) {
      // Close all connections
      for (const participant of room.participants.values()) {
        participant.ws.close();
      }
      rooms.delete(code);
    }
  }
}, 60 * 60 * 1000); // Check every hour

export const GET: RequestHandler = async ({ request }) => {
  const upgradeHeader = request.headers.get('upgrade');
  if (upgradeHeader !== 'websocket') {
    return new Response('Expected WebSocket', { status: 426 });
  }

  // For development, we'll need to use a different approach
  // Consider using Socket.IO or a separate WebSocket server
  return new Response(JSON.stringify({ 
    error: 'WebSocket endpoint placeholder. Implement with Socket.IO or separate WS server.' 
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
};

function handleWebSocketMessage(ws: WebSocket, data: any) {
  switch (data.type) {
    case 'join':
      handleJoin(ws, data);
      break;
    case 'start_nominations':
      handleStartNominations(ws, data);
      break;
    case 'nominate_movie':
      handleNominateMovie(ws, data);
      break;
    case 'mark_ready':
      handleMarkReady(ws, data);
      break;
    case 'start_voting':
      handleStartVoting(ws, data);
      break;
    case 'vote':
      handleVote(ws, data);
      break;
    case 'reveal_winner':
      handleRevealWinner(ws, data);
      break;
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;
    default:
      ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
  }
}

function handleJoin(ws: WebSocket, data: any) {
  const { roomCode, userId, nickname, isHost } = data;

  // Get or create room
  let room = rooms.get(roomCode);
  if (!room && isHost) {
    // Create new room if host
    room = {
      code: roomCode,
      hostId: userId,
      phase: 'waiting',
      participants: new Map(),
      nominations: new Map(),
      winner: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    rooms.set(roomCode, room);
  }

  if (!room) {
    ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
    return;
  }

  // Add participant
  const participant = {
    id: userId,
    nickname,
    isHost,
    isReady: false,
    hasNominated: false,
    hasVoted: false,
    ws
  };
  room.participants.set(userId, participant);
  room.updatedAt = Date.now();

  // Send room update to new participant
  ws.send(JSON.stringify({
    type: 'room_update',
    room: serializeRoom(room)
  }));

  // Notify others of new participant
  broadcastToRoom(room, {
    type: 'user_joined',
    participant: {
      id: userId,
      nickname,
      isHost,
      isReady: false,
      hasNominated: false,
      hasVoted: false
    }
  }, userId);
}

function handleStartNominations(ws: WebSocket, data: any) {
  const room = getRoomByWebSocket(ws);
  if (!room) return;

  const participant = getParticipantByWebSocket(room, ws);
  if (!participant?.isHost) {
    ws.send(JSON.stringify({ type: 'error', message: 'Only host can start nominations' }));
    return;
  }

  room.phase = 'nominating';
  room.updatedAt = Date.now();

  broadcastToRoom(room, {
    type: 'phase_changed',
    phase: 'nominating'
  });
}

function handleNominateMovie(ws: WebSocket, data: any) {
  const room = getRoomByWebSocket(ws);
  if (!room || room.phase !== 'nominating') return;

  const participant = getParticipantByWebSocket(room, ws);
  if (!participant) return;

  const movieId = `movie_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const movie = {
    id: movieId,
    ...data.movie,
    nominatedBy: participant.id,
    votes: new Set<string>()
  };

  room.nominations.set(movieId, movie);
  participant.hasNominated = true;
  room.updatedAt = Date.now();

  broadcastToRoom(room, {
    type: 'movie_nominated',
    movie: { ...movie, votes: [] },
    participantId: participant.id
  });

  // Check if all participants have nominated
  const allNominated = Array.from(room.participants.values()).every(p => p.hasNominated);
  if (allNominated) {
    // Notify host that everyone has nominated
    const host = Array.from(room.participants.values()).find(p => p.isHost);
    if (host) {
      host.ws.send(JSON.stringify({ type: 'all_nominated' }));
    }
  }
}

function handleStartVoting(ws: WebSocket, data: any) {
  const room = getRoomByWebSocket(ws);
  if (!room) return;

  const participant = getParticipantByWebSocket(room, ws);
  if (!participant?.isHost) {
    ws.send(JSON.stringify({ type: 'error', message: 'Only host can start voting' }));
    return;
  }

  room.phase = 'voting';
  room.updatedAt = Date.now();

  // Reset voting status
  for (const p of room.participants.values()) {
    p.hasVoted = false;
  }

  broadcastToRoom(room, {
    type: 'phase_changed',
    phase: 'voting'
  });
}

function handleVote(ws: WebSocket, data: any) {
  const room = getRoomByWebSocket(ws);
  if (!room || room.phase !== 'voting') return;

  const participant = getParticipantByWebSocket(room, ws);
  if (!participant || participant.hasVoted) return;

  const { movieId } = data;
  const movie = room.nominations.get(movieId);
  if (!movie) return;

  movie.votes.add(participant.id);
  participant.hasVoted = true;
  room.updatedAt = Date.now();

  broadcastToRoom(room, {
    type: 'vote_cast',
    movieId,
    participantId: participant.id
  });

  // Check if all participants have voted
  const allVoted = Array.from(room.participants.values()).every(p => p.hasVoted);
  if (allVoted) {
    // Notify host that everyone has voted
    const host = Array.from(room.participants.values()).find(p => p.isHost);
    if (host) {
      host.ws.send(JSON.stringify({ type: 'all_voted' }));
    }
  }
}

function handleRevealWinner(ws: WebSocket, data: any) {
  const room = getRoomByWebSocket(ws);
  if (!room) return;

  const participant = getParticipantByWebSocket(room, ws);
  if (!participant?.isHost) {
    ws.send(JSON.stringify({ type: 'error', message: 'Only host can reveal winner' }));
    return;
  }

  // Calculate winner
  let maxVotes = 0;
  let winner = null;
  for (const movie of room.nominations.values()) {
    if (movie.votes.size > maxVotes) {
      maxVotes = movie.votes.size;
      winner = movie;
    }
  }

  room.phase = 'complete';
  room.winner = winner ? { ...winner, votes: Array.from(winner.votes) } : null;
  room.updatedAt = Date.now();

  broadcastToRoom(room, {
    type: 'winner_revealed',
    winner: room.winner
  });
}

function handleMarkReady(ws: WebSocket, data: any) {
  const room = getRoomByWebSocket(ws);
  if (!room) return;

  const participant = getParticipantByWebSocket(room, ws);
  if (!participant) return;

  participant.isReady = true;
  room.updatedAt = Date.now();

  broadcastToRoom(room, {
    type: 'participant_ready',
    participantId: participant.id
  });
}

function handleWebSocketClose(ws: WebSocket) {
  // Find and remove participant
  for (const room of rooms.values()) {
    for (const [userId, participant] of room.participants.entries()) {
      if (participant.ws === ws) {
        room.participants.delete(userId);
        room.updatedAt = Date.now();

        // Notify others
        broadcastToRoom(room, {
          type: 'user_left',
          participantId: userId
        });

        // Clean up empty rooms
        if (room.participants.size === 0) {
          rooms.delete(room.code);
        }
        return;
      }
    }
  }
}

// Helper functions
function getRoomByWebSocket(ws: WebSocket): Room | null {
  for (const room of rooms.values()) {
    for (const participant of room.participants.values()) {
      if (participant.ws === ws) {
        return room;
      }
    }
  }
  return null;
}

function getParticipantByWebSocket(room: Room, ws: WebSocket) {
  for (const participant of room.participants.values()) {
    if (participant.ws === ws) {
      return participant;
    }
  }
  return null;
}

function broadcastToRoom(room: Room, message: any, excludeUserId?: string) {
  const messageStr = JSON.stringify(message);
  for (const participant of room.participants.values()) {
    if (participant.id !== excludeUserId) {
      participant.ws.send(messageStr);
    }
  }
}

function serializeRoom(room: Room) {
  return {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    participants: Array.from(room.participants.values()).map(p => ({
      id: p.id,
      nickname: p.nickname,
      isHost: p.isHost,
      isReady: p.isReady,
      hasNominated: p.hasNominated,
      hasVoted: p.hasVoted
    })),
    nominations: Array.from(room.nominations.values()).map(m => ({
      ...m,
      votes: Array.from(m.votes)
    })),
    winner: room.winner,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt
  };
} 