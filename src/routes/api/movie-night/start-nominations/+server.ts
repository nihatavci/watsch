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

		// Update room phase to nominating
		room.phase = 'nominating';
		await kv.set(`room:${roomCode}`, room);

		return json({
			phase: room.phase,
			message: 'Nomination phase started successfully'
		});
	} catch (error) {
		console.error('Error starting nomination phase:', error);
		return json({ error: { message: 'Failed to start nominations' } }, { status: 500 });
	}
}
