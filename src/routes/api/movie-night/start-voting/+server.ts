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

		if (room.phase !== 'nominate') {
			return json({ error: { message: 'Room is not in nomination phase' } }, { status: 400 });
		}

		if (room.nominations.length < 2) {
			return json(
				{ error: { message: 'At least 2 nominations are required to start voting' } },
				{ status: 400 }
			);
		}

		room.phase = 'vote';
		await kv.set(`room:${roomCode}`, room);

		return json({
			phase: room.phase
		});
	} catch (error) {
		console.error('Error starting voting phase:', error);
		return json({ error: { message: 'Failed to start voting phase' } }, { status: 500 });
	}
}
