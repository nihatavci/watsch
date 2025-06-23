import { json } from '@sveltejs/kit';
import { kv } from '$lib/store/kv';

interface Participant {
	id: string;
	nickname: string;
}

interface Vote {
	movieId: string;
	participantId: string;
	nickname: string;
	timestamp: number;
}

interface MovieNightRoom {
	participants: Participant[];
	votes: Record<string, Vote[]>;
	phase: string;
	nominations: any[];
}

export async function POST({ request }) {

	try {
		const { roomCode, movieId, participantId, nickname, votes: selectedVotes } = await request.json();

		if (!roomCode || !nickname) {
			return json(
				{ error: { message: 'Room code and nickname are required' } },
				{ status: 400 }
			);
		}

		// Handle both vote formats: single movieId or votes array
		let votesToSubmit: string[] = [];
		if (movieId) {
			votesToSubmit = [movieId];
		} else if (selectedVotes && Array.isArray(selectedVotes)) {
			votesToSubmit = selectedVotes;
		} else {
			return json(
				{ error: { message: 'Movie selection is required' } },
				{ status: 400 }
			);
		}

		const room = await kv.get(`room:${roomCode.toLowerCase()}`) as MovieNightRoom;

		if (!room) {
			return json({ error: { message: 'Room not found' } }, { status: 404 });
		}

		// Allow voting in 'voting', 'vote', and 'results' phases
		if (room.phase !== 'voting' && room.phase !== 'vote' && room.phase !== 'results') {
			return json(
				{ error: { message: 'Room is not in voting phase' } },
				{ status: 400 }
			);
		}

		// Find participant by nickname (more reliable than ID)
		const participant = (room.participants as Participant[]).find(
			(p: Participant) => p.nickname.toLowerCase() === nickname.toLowerCase()
		);

		if (!participant) {
			return json({ error: { message: 'You are not a participant in this room' } }, { status: 404 });
		}

		// Initialize votes object if not present
		if (!room.votes) room.votes = {};

		// Store vote with detailed information
		const voteData: Vote = {
			movieId: votesToSubmit[0], // Only allow one vote per participant
			participantId: participant.id,
			nickname: participant.nickname,
			timestamp: Date.now()
		};

		// Store the vote
		room.votes[participant.id] = [voteData];

		// Update room in storage
		await kv.set(`room:${roomCode.toLowerCase()}`, room);

		console.log(`Vote recorded: ${participant.nickname} voted for movie ${votesToSubmit[0]} in room ${roomCode}`);

		return json({
			success: true,
			votes: room.votes,
			phase: room.phase,
			message: 'Vote recorded successfully'
		});
	} catch (error) {
		console.error('Error submitting votes:', error);
		return json({ error: { message: 'Failed to submit votes' } }, { status: 500 });
	}
}
