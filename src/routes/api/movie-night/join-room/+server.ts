import { json } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import { kv } from '$lib/store/kv';

export async function POST({ request }) {
	try {
		const { roomCode, nickname } = await request.json();
		
		if (!roomCode || !nickname) {
			return json({ error: { message: 'Room code and nickname are required' } }, { status: 400 });
		}

		const room = await kv.get(`room:${roomCode.toLowerCase()}`);
		
		if (!room) {
			return json({ error: { message: 'Room not found' } }, { status: 404 });
		}

		// Check if nickname is already taken
		if (room.participants.some(p => p.nickname.toLowerCase() === nickname.toLowerCase())) {
			return json({ error: { message: 'Nickname already taken' } }, { status: 400 });
		}

		const participantId = nanoid();
		room.participants.push({ id: participantId, nickname });
		
		await kv.set(`room:${roomCode}`, room);

		return json({
			participantId,
			participants: room.participants,
			phase: room.phase,
			nominations: room.nominations
		});
	} catch (error) {
		console.error('Error joining room:', error);
		return json({ error: { message: 'Failed to join room' } }, { status: 500 });
	}
} 