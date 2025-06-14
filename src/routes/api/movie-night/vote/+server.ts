import { json } from '@sveltejs/kit';
import { kv } from '$lib/store/kv';

interface Participant {
	id: string;
	nickname: string;
}

// CSRF protection helper
function getCsrfTokenFromCookie(cookieHeader: string | null): string | null {
	if (!cookieHeader) return null;
	const match = cookieHeader.match(/csrf_token=([^;]+)/);
	return match ? match[1] : null;
}

// Consider defining a more complete MovieNightRoom interface here or in a shared types file
// interface MovieNightRoom {
//  participants: Participant[];
//  votes: Record<string, any[]>; // Or more specific type for votes
//  phase: string;
//  // ... other room properties
// }

export async function POST({ request, cookies, headers }) {
	// --- CSRF Protection ---
	const csrfCookie = cookies.get('csrf_token') || getCsrfTokenFromCookie(request.headers.get('cookie'));
	const csrfHeader = headers.get('x-csrf-token');
	if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
		return json({ error: { message: 'CSRF token missing or invalid' } }, { status: 403 });
	}
	// --- End CSRF Protection ---

	try {
		const { roomCode, nickname, votes: selectedVotes } = await request.json();

		if (!roomCode || !nickname || !selectedVotes) {
			return json(
				{ error: { message: 'Room code, nickname, and votes are required' } },
				{ status: 400 }
			);
		}

		const room = await kv.get(`room:${roomCode.toLowerCase()}`); // room is implicitly any

		if (!room) {
			return json({ error: { message: 'Room not found' } }, { status: 404 });
		}

		if (room.phase !== 'vote' && room.phase !== 'results') {
			return json(
				{ error: { message: 'Room is not in voting or results phase' } },
				{ status: 400 }
			);
		}

		const participant = (room.participants as Participant[]).find(
			(p: Participant) => p.nickname.toLowerCase() === nickname.toLowerCase()
		);

		if (!participant) {
			return json({ error: { message: 'Participant not found' } }, { status: 404 });
		}

		// Update votes - only allow one vote
		// Assuming room.votes is an object where keys are participant.id
		if (!room.votes) room.votes = {}; // Initialize if not present
		room.votes[participant.id] = selectedVotes.slice(0, 1);

		await kv.set(`room:${roomCode}`, room);

		return json({
			votes: room.votes,
			phase: room.phase
		});
	} catch (error) {
		console.error('Error submitting votes:', error);
		return json({ error: { message: 'Failed to submit votes' } }, { status: 500 });
	}
}
