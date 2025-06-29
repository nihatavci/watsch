import { json } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import { kv } from '$lib/store/kv';
import { broadcastToRoom } from '$lib/utils/movie-night-sse';
import { sanitizeInput } from '$lib/utils/sanitize';

// Security: Rate limiting for room joining
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

function checkRateLimit(ip: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
	const now = Date.now();
	const limit = rateLimitMap.get(ip);
	
	if (!limit || now - limit.lastReset > windowMs) {
		rateLimitMap.set(ip, { count: 1, lastReset: now });
		return true;
	}
	
	if (limit.count >= maxRequests) {
		return false;
	}
	
	limit.count++;
	return true;
}

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

export async function POST({ request, getClientAddress }) {
	try {
		// Security: Rate limiting
		const clientIP = getClientAddress();
		if (!checkRateLimit(clientIP, 10, 60000)) {
			return json({ 
				error: { message: 'Too many join attempts. Please wait before trying again.' } 
			}, { status: 429 });
		}

		const body = await request.json();
		const { roomCode, userId, nickname, isHost } = body;

		// Security: Input validation
		if (!roomCode || typeof roomCode !== 'string') {
			return json({ error: { message: 'Valid room code is required' } }, { status: 400 });
		}

		if (!nickname || typeof nickname !== 'string') {
			return json({ error: { message: 'Valid nickname is required' } }, { status: 400 });
		}

		// Security: Sanitize inputs
		const sanitizedRoomCode = sanitizeInput(roomCode.toLowerCase().trim());
		const sanitizedNickname = sanitizeInput(nickname.trim());

		// Validate room code format (alphanumeric, 6 characters)
		if (!/^[a-z0-9]{6}$/.test(sanitizedRoomCode)) {
			return json({ error: { message: 'Invalid room code format' } }, { status: 400 });
		}

		// Security: Check for malicious content in nickname
		const originalNicknameLength = nickname.trim().length;
		const hasScript = /<script|javascript:|data:|vbscript:|on\w+\s*=/gi.test(nickname);
		
		if (hasScript) {
			console.warn(`[Security] Malicious input rejected from ${clientIP}: ${nickname.substring(0, 20)}...`);
			return json({ 
				error: { message: 'Invalid characters in nickname' } 
			}, { status: 400 });
		}

		// Security: Reject if sanitization removed significant content
		if (sanitizedNickname.length < originalNicknameLength * 0.7) {
			console.warn(`[Security] Input rejected due to sanitization removing content from ${clientIP}`);
			return json({ 
				error: { message: 'Invalid characters in nickname' } 
			}, { status: 400 });
		}

		// Validate nickname length
		if (sanitizedNickname.length < 1 || sanitizedNickname.length > 20) {
			return json({ 
				error: { message: 'Nickname must be between 1 and 20 characters' } 
			}, { status: 400 });
		}

		const room = await kv.get(`room:${sanitizedRoomCode}`) as MovieNightRoom | null;

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
		await kv.set(`room:${sanitizedRoomCode}`, room);

		// Broadcast participant joined event
		broadcastToRoom(sanitizedRoomCode, {
			type: 'participant_joined',
			participant: room.participants.find(p => p.id === userId || p.nickname === nickname)
		});

		return json(room);
	} catch (error) {
		console.error('Error joining room:', error);
		return json({ error: { message: 'Failed to join room' } }, { status: 500 });
	}
}
