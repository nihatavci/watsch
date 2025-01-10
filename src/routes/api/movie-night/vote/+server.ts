import { json } from '@sveltejs/kit';
import { kv } from '$lib/store/kv';

export async function POST({ request }) {
	try {
		const { roomCode, nickname, votes: selectedVotes } = await request.json();
		
		if (!roomCode || !nickname || !selectedVotes) {
			return json({ error: { message: 'Room code, nickname, and votes are required' } }, { status: 400 });
		}

		const room = await kv.get(`room:${roomCode.toLowerCase()}`);
		
		if (!room) {
			return json({ error: { message: 'Room not found' } }, { status: 404 });
		}

		if (room.phase !== 'vote' && room.phase !== 'results') {
			return json({ error: { message: 'Room is not in voting or results phase' } }, { status: 400 });
		}

		const participant = room.participants.find(p => p.nickname.toLowerCase() === nickname.toLowerCase());
		
		if (!participant) {
			return json({ error: { message: 'Participant not found' } }, { status: 404 });
		}

		// Update votes - only allow one vote
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