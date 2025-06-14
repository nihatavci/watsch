import { json } from '@sveltejs/kit';
import { kv } from '$lib/store/kv';

interface Participant {
	id: string;
	nickname: string;
}

interface Nomination {
	participant: Participant;
	movie: any; // Define more specifically if movie structure is known
}

// interface MovieNightRoom {
//  participants: Participant[];
//  nominations: Nomination[];
//  phase: string;
//  // ... other room properties
// }

export async function POST({ request }) {
	try {
		const { roomCode, nickname, movie } = await request.json();

		if (!roomCode || !nickname || !movie) {
			return json(
				{ error: { message: 'Room code, nickname, and movie are required' } },
				{ status: 400 }
			);
		}

		const room = await kv.get(`room:${roomCode.toLowerCase()}`); // room is implicitly any

		if (!room) {
			return json({ error: { message: 'Room not found' } }, { status: 404 });
		}

		if (room.phase !== 'nominate') {
			return json({ error: { message: 'Room is not in nomination phase' } }, { status: 400 });
		}

		const participant = (room.participants as Participant[]).find(
			(p: Participant) => p.nickname.toLowerCase() === nickname.toLowerCase()
		);

		if (!participant) {
			return json({ error: { message: 'Participant not found' } }, { status: 404 });
		}

		// Check if participant has already nominated
		if ((room.nominations as Nomination[]).some((n: Nomination) => n.participant.id === participant.id)) {
			return json({ error: { message: 'You have already nominated a movie' } }, { status: 400 });
		}

		(room.nominations as Nomination[]).push({
			participant,
			movie
		});

		await kv.set(`room:${roomCode}`, room);

		return json({
			nominations: room.nominations
		});
	} catch (error) {
		console.error('Error nominating movie:', error);
		return json({ error: { message: 'Failed to nominate movie' } }, { status: 500 });
	}
}
