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

		// Check if room has nominations
		if (!room.nominations || room.nominations.length === 0) {
			return json(
				{ error: { message: 'Cannot start voting without nominations' } },
				{ status: 400 }
			);
		}

		// Set phase to voting and initialize votes object
		room.phase = 'voting';
		room.updatedAt = Date.now();
		if (!room.votes) {
			room.votes = {};
		}

		await kv.set(`room:${roomCode.toLowerCase()}`, room);

		console.log(`Voting started for room ${roomCode} with ${room.nominations.length} nominations`);

		return json({
			success: true,
			phase: room.phase,
			nominations: room.nominations,
			votes: room.votes
		});
	} catch (error) {
		console.error('Error starting voting:', error);
		return json({ error: { message: 'Failed to start voting' } }, { status: 500 });
	}
}
