import { json } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import { kv } from '$lib/store/kv';
import { broadcastToRoom } from '../events/+server';

interface Participant {
	id: string;
	nickname: string;
	isHost: boolean;
	isReady: boolean;
	hasNominated: boolean;
	hasVoted: boolean;
	joinedAt: number;
}

interface MovieNightRoom {
	code: string;
	hostId: string;
	phase: 'waiting' | 'nominating' | 'voting' | 'reveal' | 'complete';
	participants: Participant[];
	nominations: any[];
	winner: any;
	createdAt: number;
	updatedAt: number;
}

export async function POST({ request }) {
	try {
		const { roomCode, userId, nickname, isHost } = await request.json();

		if (!roomCode || !nickname) {
			return json({ error: { message: 'Room code and nickname are required' } }, { status: 400 });
		}

		const room = await kv.get(`room:${roomCode.toLowerCase()}`) as MovieNightRoom;

		if (!room) {
			return json({ error: { message: 'Room not found' } }, { status: 404 });
		}

		// Check if user already exists (by userId)
		const existingParticipant = room.participants.find(p => p.id === userId);
		if (existingParticipant) {
			// User rejoining, update their info
			existingParticipant.nickname = nickname;
			existingParticipant.joinedAt = Date.now();
		} else {
			// Check if nickname is taken
			if (room.participants.some(p => p.nickname.toLowerCase() === nickname.toLowerCase())) {
				return json({ error: { message: 'Nickname already taken' } }, { status: 400 });
			}

			// Add new participant
			const participant: Participant = {
				id: userId || nanoid(),
				nickname,
				isHost: isHost || false,
				isReady: false,
				hasNominated: false,
				hasVoted: false,
				joinedAt: Date.now()
			};
			room.participants.push(participant);
		}

		room.updatedAt = Date.now();
		await kv.set(`room:${roomCode.toLowerCase()}`, room);

		// Broadcast participant joined event
		broadcastToRoom(roomCode, {
			type: 'participant_joined',
			participant: room.participants.find(p => p.id === userId || p.nickname === nickname)
		});

		return json(room);
	} catch (error) {
		console.error('Error joining room:', error);
		return json({ error: { message: 'Failed to join room' } }, { status: 500 });
	}
}
