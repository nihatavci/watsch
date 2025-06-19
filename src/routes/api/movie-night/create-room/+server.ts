import { json } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import { kv } from '$lib/store/kv';

export async function POST({ request }) {
	try {
		const { hostNickname } = await request.json();

		if (!hostNickname) {
			return json({ error: { message: 'Nickname is required' } }, { status: 400 });
		}

		const roomCode = nanoid(6).toLowerCase();
		const hostId = nanoid();

		const room = {
			code: roomCode,
			hostId: hostId,
			phase: 'waiting' as const,
			participants: [{
				id: hostId,
				nickname: hostNickname,
				isHost: true,
				isReady: true, // Host is always ready
				hasNominated: false,
				hasVoted: false,
				joinedAt: Date.now()
			}],
			nominations: [],
			winner: null,
			createdAt: Date.now(),
			updatedAt: Date.now()
		};

		await kv.set(`room:${roomCode}`, room, { ex: 7200 }); // Expires in 2 hours

		return json({
			roomCode,
			hostId
		});
	} catch (error) {
		console.error('Error creating room:', error);
		return json({ error: { message: 'Failed to create room' } }, { status: 500 });
	}
}
