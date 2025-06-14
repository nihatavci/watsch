import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY } from '$lib/env-loader';
import { env } from '$lib/env';
import { callOpenAI } from '$lib/api/openai';
import { canPerformSearch, incrementSearchCount } from '$lib/api/db';
import { searchMedia } from '$lib/api/search-engine';
import { getRecommendations } from '$lib/api/recommendation-engine';

// Add extensive logging for debugging
console.log('Server-side environment check:');
console.log('TMDB_API_KEY exists:', !!env.TMDB_API_KEY);
console.log('TMDB_API_KEY length:', env.TMDB_API_KEY?.length);

type GenreMap = {
	[key: string]: number;
};

// Define the type for enhanced query parameters
interface EnhancedQueryParams {
	'primary_release_date.gte'?: string;
	'primary_release_date.lte'?: string;
	sort_by?: string;
	'vote_average.gte'?: string;
	include_adult?: string;
	[key: string]: string | undefined;
}

// Define person/actor search result interface
interface PersonSearchResult {
	id: number;
	name: string;
	popularity: number;
	profile_path: string | null;
}

// Genre maps to convert user-friendly names to TMDB IDs
const GENRE_MAP: GenreMap = {
	Action: 28,
	Adventure: 12,
	Animation: 16,
	Comedy: 35,
	Crime: 80,
	Documentary: 99,
	Drama: 18,
	Family: 10751,
	Fantasy: 14,
	Horror: 27,
	Mystery: 9648,
	Romance: 10749,
	'Sci-Fi': 878,
	Thriller: 53
};

const TV_GENRE_MAP: GenreMap = {
	Action: 10759,
	Adventure: 10759,
	Animation: 16,
	Comedy: 35,
	Crime: 80,
	Documentary: 99,
	Drama: 18,
	Family: 10751,
	Fantasy: 10765,
	Horror: 9648,
	Mystery: 9648,
	Romance: 10749,
	'Sci-Fi': 10765,
	Thriller: 80
};

// Helper function to verify token and extract user info
function getUserIdFromToken(authHeader: string | null): string | null {
	console.log('[Auth Debug] Received auth header:', authHeader ? 'Present' : 'Missing');
	
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		console.log('[Auth Debug] Invalid auth header format');
		return null;
	}
	
	try {
		const token = authHeader.split(' ')[1];
		console.log('[Auth Debug] Token extracted:', token.substring(0, 10) + '...');
		
		// For JWT tokens, extract user info from payload
		const payloadBase64 = token.split('.')[1];
		console.log('[Auth Debug] Base64 payload:', payloadBase64.substring(0, 10) + '...');
		
		const payload = JSON.parse(atob(payloadBase64));
		console.log('[Auth Debug] Decoded payload:', JSON.stringify(payload, null, 2));
		
		const userId = payload.sub || null;
		console.log('[Auth Debug] Extracted user ID:', userId);
		
		return userId;
	} catch (error) {
		console.error('[Auth Debug] Error parsing token:', error);
		console.error('[Auth Debug] Token parsing stack:', new Error().stack);
		return null;
	}
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	console.log('\n[Request Debug] ====== New Request ======');
	const requestStartTime = Date.now();
	
	try {
		const ip = getClientAddress();
		console.log('[Request Debug] Client IP:', ip);

		// Log all request headers
		const headers = Object.fromEntries(request.headers.entries());
		console.log('[Request Debug] Request headers:', JSON.stringify(headers, null, 2));

		const authHeader = request.headers.get('authorization');
		console.log('[Auth Debug] Authorization header:', authHeader ? 'Present' : 'Missing');
		
		const userId = getUserIdFromToken(authHeader);
		const isAuthenticated = !!userId;
		console.log('[Auth Debug] Authentication status:', { isAuthenticated, userId });
		
		// Check if user can perform search
		console.log('[Search Debug] Checking search limits...');
		const canSearch = await canPerformSearch(ip, isAuthenticated);
		console.log('[Search Debug] Can perform search:', canSearch);

		if (!canSearch) {
			console.warn('[Search Debug] Search limit reached:', {
				ip,
				isAuthenticated,
				userId,
				timestamp: new Date().toISOString()
			});
			
			return json(
				{
					error: 'Search limit reached',
					limit: true,
					message: 'You have reached your daily search limit. Sign in to get unlimited searches!',
					debug: {
						isAuthenticated,
						timestamp: new Date().toISOString()
					}
				},
				{ status: 429 }
			);
		}

		// Parse request body
		const body = await request.json();
		console.log('[Debug] Incoming request body:', body);

		const { query, mediaType = 'movie', genres = [], platforms = [] } = body;

		// Map genre names to TMDB IDs if needed
		let genreIds = genres;
		if (genres.length > 0 && typeof genres[0] === 'string' && isNaN(Number(genres[0]))) {
			const map = mediaType === 'tv' ? TV_GENRE_MAP : GENRE_MAP;
			genreIds = genres.map((g: string) => map[g] || g).filter(Boolean);
		}

		if (!query) {
			console.warn('[Validation Debug] Missing query parameter');
			return json({ error: 'Query is required' }, { status: 400 });
		}

		console.log('[Search Debug] Starting recommendation search:', {
			query,
			mediaType,
			genres: genreIds,
			platforms
		});

		// Get recommendations
		const recommendations = await getRecommendations({
			query,
			mediaType,
			genres: genreIds,
			platforms
		});

		if (recommendations.length === 0) {
			return json({ results: [], message: 'No matches found.' }, { status: 200 });
		}

		console.log('[Search Debug] Found recommendations:', recommendations.length);

		// Increment search count for unauthenticated users
		if (!isAuthenticated) {
			console.log('[Search Debug] Incrementing search count for unauthenticated user');
			await incrementSearchCount(ip);
		}

		const requestDuration = Date.now() - requestStartTime;
		console.log(`[Request Debug] Request completed in ${requestDuration}ms`);

		return json({ 
			results: recommendations,
			debug: {
				duration: requestDuration,
				isAuthenticated,
				timestamp: new Date().toISOString()
			}
		});
	} catch (error) {
		console.error('[Error Debug] ====== Error Details ======');
		console.error('[Error Debug] Error:', error);
		console.error('[Error Debug] Stack:', error instanceof Error ? error.stack : 'No stack available');
		console.error('[Error Debug] Request duration:', Date.now() - requestStartTime, 'ms');
		
		return json({ 
			error: 'Failed to get recommendations',
			debug: {
				message: error instanceof Error ? error.message : 'Unknown error',
				timestamp: new Date().toISOString()
			}
		}, { status: 500 });
	}
};
