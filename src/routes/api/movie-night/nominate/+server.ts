import { json } from '@sveltejs/kit';
import { kv } from '$lib/store/kv';
import { sanitizeInput } from '$lib/utils/sanitize';

interface Participant {
	id: string;
	nickname: string;
}

interface Movie {
	id: string | number;
	title: string;
	overview?: string;
	poster_path?: string | null;
	backdrop_path?: string | null;
	release_date?: string;
	vote_average?: number;
	media_type?: 'movie' | 'tv';
}

interface Nomination {
	participant: Participant;
	movie: Movie;
}

interface MovieNightRoom {
	participants: Participant[];
	nominations: Nomination[];
	phase: string;
	hostId: string;
	code: string;
	createdAt: number;
	updatedAt: number;
}

// Rate limiting storage (in production, use Redis or proper cache)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

function checkRateLimit(identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
	const now = Date.now();
	const key = identifier;
	const limit = rateLimitMap.get(key);
	
	if (!limit || now - limit.lastReset > windowMs) {
		rateLimitMap.set(key, { count: 1, lastReset: now });
		return true;
	}
	
	if (limit.count >= maxRequests) {
		return false;
	}
	
	limit.count++;
	return true;
}

function validateMovie(movie: any): Movie | null {
	if (!movie || typeof movie !== 'object') {
		return null;
	}

	// Validate required fields
	if (!movie.id || (!movie.title && !movie.name)) {
		return null;
	}

	const validatedMovie: Movie = {
		id: sanitizeInput(String(movie.id)),
		title: sanitizeInput(movie.title || movie.name || ''),
	};

	// Optional fields with validation
	if (movie.overview && typeof movie.overview === 'string') {
		validatedMovie.overview = sanitizeInput(movie.overview.substring(0, 1000)); // Limit length
	}

	if (movie.poster_path && typeof movie.poster_path === 'string') {
		// Validate it's a proper URL or TMDB path
		const path = movie.poster_path;
		if (path.startsWith('http') || path.startsWith('/')) {
			validatedMovie.poster_path = sanitizeInput(path);
		}
	}

	if (movie.backdrop_path && typeof movie.backdrop_path === 'string') {
		const path = movie.backdrop_path;
		if (path.startsWith('http') || path.startsWith('/')) {
			validatedMovie.backdrop_path = sanitizeInput(path);
		}
	}

	if (movie.release_date && typeof movie.release_date === 'string') {
		// Basic date validation
		const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
		if (dateRegex.test(movie.release_date)) {
			validatedMovie.release_date = movie.release_date;
		}
	}

	if (typeof movie.vote_average === 'number' && movie.vote_average >= 0 && movie.vote_average <= 10) {
		validatedMovie.vote_average = movie.vote_average;
	}

	if (movie.media_type === 'movie' || movie.media_type === 'tv') {
		validatedMovie.media_type = movie.media_type;
	}

	return validatedMovie;
}

export async function POST({ request, getClientAddress }) {
	try {
		// Rate limiting based on IP address
		const clientIP = getClientAddress();
		if (!checkRateLimit(clientIP, 20, 60000)) { // 20 nominations per minute
			return json(
				{ error: { message: 'Too many requests. Please wait before nominating again.' } },
				{ status: 429 }
			);
		}

		const body = await request.json();
		const { roomCode, nickname, movie } = body;

		// Input validation
		if (!roomCode || typeof roomCode !== 'string') {
			return json(
				{ error: { message: 'Valid room code is required' } },
				{ status: 400 }
			);
		}

		if (!nickname || typeof nickname !== 'string') {
			return json(
				{ error: { message: 'Valid nickname is required' } },
				{ status: 400 }
			);
		}

		if (!movie) {
			return json(
				{ error: { message: 'Movie data is required' } },
				{ status: 400 }
			);
		}

		// Sanitize inputs
		const sanitizedRoomCode = sanitizeInput(roomCode.toLowerCase().trim());
		const sanitizedNickname = sanitizeInput(nickname.trim());

		// Validate room code format (alphanumeric, 6 characters)
		if (!/^[a-z0-9]{6}$/.test(sanitizedRoomCode)) {
			return json(
				{ error: { message: 'Invalid room code format' } },
				{ status: 400 }
			);
		}

		// Validate nickname length
		if (sanitizedNickname.length < 1 || sanitizedNickname.length > 20) {
			return json(
				{ error: { message: 'Nickname must be between 1 and 20 characters' } },
				{ status: 400 }
			);
		}

		// Validate movie data
		const validatedMovie = validateMovie(movie);
		if (!validatedMovie) {
			return json(
				{ error: { message: 'Invalid movie data provided' } },
				{ status: 400 }
			);
		}

		const room = await kv.get(`room:${sanitizedRoomCode}`) as MovieNightRoom | null;

		if (!room) {
			return json({ error: { message: 'Room not found' } }, { status: 404 });
		}

		// Validate room phase
		if (room.phase !== 'nominating' && room.phase !== 'nominate') {
			return json({ error: { message: 'Room is not in nomination phase' } }, { status: 400 });
		}

		// Find participant
		const participant = room.participants.find(
			(p: Participant) => p.nickname.toLowerCase() === sanitizedNickname.toLowerCase()
		);

		if (!participant) {
			return json({ error: { message: 'Participant not found in room' } }, { status: 404 });
		}

		// Check if participant has already nominated
		if (room.nominations.some((n: Nomination) => n.participant.id === participant.id)) {
			return json({ error: { message: 'You have already nominated a movie' } }, { status: 400 });
		}

		// Check nomination limit (max 10 nominations per room)
		if (room.nominations.length >= 10) {
			return json({ error: { message: 'Maximum number of nominations reached for this room' } }, { status: 400 });
		}

		// Add nomination
		room.nominations.push({
			participant,
			movie: validatedMovie
		});

		// Update room timestamp
		room.updatedAt = Date.now();

		// Save updated room
		await kv.set(`room:${sanitizedRoomCode}`, room);

		console.log(`[nominate] Successfully added nomination for ${sanitizedNickname} in room ${sanitizedRoomCode}`);

		return json({
			success: true,
			nominations: room.nominations,
			message: 'Movie nominated successfully'
		});

	} catch (error) {
		console.error('Error nominating movie:', error);
		return json({ 
			error: { message: 'Failed to nominate movie. Please try again.' } 
		}, { status: 500 });
	}
}
