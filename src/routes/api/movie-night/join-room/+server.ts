import { json } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import { kv } from '$lib/store/kv';

interface Participant {
	id: string;
	nickname: string;
	// Add other participant properties if any
}

// We can also define a basic Room type here if needed, based on usage
// interface MovieNightRoom {
// 	participants: Participant[];
// 	phase: string; // Or a more specific enum/type
// 	nominations: any[]; // Define Nomination type if known
// 	// Add other room properties if any
// }

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

		// Assuming room.participants is an array of Participant objects
		// and room has a participants property of type Participant[]
		if ((room.participants as Participant[]).some((p: Participant) => p.nickname.toLowerCase() === nickname.toLowerCase())) {
			return json({ error: { message: 'Nickname already taken' } }, { status: 400 });
		}

		const participantId = nanoid();
		(room.participants as Participant[]).push({ id: participantId, nickname });

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
