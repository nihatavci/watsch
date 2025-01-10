import { json } from '@sveltejs/kit';
import { kv } from '$lib/store/kv';

export async function POST({ request }) {
	try {
		const { roomCode } = await request.json();
		
		if (!roomCode) {
			return json({ error: { message: 'Room code is required' } }, { status: 400 });
		}

		const room = await kv.get(`room:${roomCode.toLowerCase()}`);
		
		if (!room) {
			return json({ error: { message: 'Room not found' } }, { status: 404 });
		}

		if (room.phase !== 'vote') {
			return json({ error: { message: 'Room is not in voting phase' } }, { status: 400 });
		}

		// Update room phase to results
		room.phase = 'results';
		await kv.set(`room:${roomCode}`, room);

		return json({
			phase: room.phase,
			votes: room.votes
		});
	} catch (error) {
		console.error('Error finishing voting:', error);
		return json({ error: { message: 'Failed to finish voting' } }, { status: 500 });
	}
} 