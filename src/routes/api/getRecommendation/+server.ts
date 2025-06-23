import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRecommendations } from '$lib/api/recommendation-engine';
import { TMDB_API_KEY } from '$lib/env-loader';
import { sanitizeInput, validateSearchQuery } from '$lib/utils/sanitize';

const genreMap: { [key: string]: number } = {
	// English names
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
	Thriller: 53,
	// German names
	Abenteuer: 12,
	Animationsfilm: 16,
	Komödie: 35,
	Krimi: 80,
	Dokumentarfilm: 99,
	Familie: 10751,
	Fantasie: 14,
	Romanze: 10749,
	// Alternative mappings
	Abenteurer: 12
};

// Rate limiting storage (in production, use Redis or proper cache)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

function checkRateLimit(identifier: string, maxRequests: number = 30, windowMs: number = 60000): boolean {
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

function validateGenres(genres: unknown): string[] {
	if (!Array.isArray(genres)) {
		return [];
	}
	
	return genres
		.filter(genre => typeof genre === 'string')
		.map(genre => sanitizeInput(genre))
		.filter(genre => Object.keys(genreMap).includes(genre))
		.slice(0, 10); // Limit to 10 genres max
}

function validatePlatforms(platforms: unknown): string[] {
	if (!Array.isArray(platforms)) {
		return [];
	}
	
	const validPlatforms = ['netflix', 'prime', 'disney', 'hbo', 'apple', 'hulu', 'paramount', 'peacock'];
	
	return platforms
		.filter(platform => typeof platform === 'string')
		.map(platform => sanitizeInput(platform.toLowerCase()))
		.filter(platform => validPlatforms.includes(platform))
		.slice(0, 5); // Limit to 5 platforms max
}

function validateMediaType(mediaType: unknown): 'movie' | 'tv' {
	if (typeof mediaType === 'string') {
		const sanitized = sanitizeInput(mediaType.toLowerCase());
		if (sanitized === 'tv' || sanitized === 'television' || sanitized === 'show') {
			return 'tv';
		}
	}
	return 'movie'; // Default to movie
}

function validateRating(rating: unknown): number | undefined {
	if (typeof rating === 'number' && rating >= 0 && rating <= 10) {
		return Math.round(rating * 10) / 10; // Round to 1 decimal
	}
	if (typeof rating === 'string') {
		const parsed = parseFloat(rating);
		if (!isNaN(parsed) && parsed >= 0 && parsed <= 10) {
			return Math.round(parsed * 10) / 10;
		}
	}
	return undefined;
}

// Mock recommendations data to ensure the feature works
const getMockRecommendations = (query: string, mediaType: string) => {
	const mockMovies = [
		{
			id: 299536,
			title: "Avengers: Infinity War",
			overview: "As the Avengers and their allies have continued to protect the world from threats too large for any one hero to handle, a new danger has emerged from the cosmic shadows: Thanos.",
			poster_path: "/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg",
			backdrop_path: "/bOGkgRGdhrBYJSLpXaxhXVstddV.jpg",
			release_date: "2018-04-25",
			vote_average: 8.3,
			vote_count: 28762,
			genre_ids: [28, 12, 878],
			description: "As the Avengers and their allies have continued to protect the world from threats too large for any one hero to handle, a new danger has emerged from the cosmic shadows: Thanos."
		},
		{
			id: 299537,
			title: "Captain Marvel",
			overview: "The story follows Carol Danvers as she becomes one of the universe's most powerful heroes when Earth is caught in the middle of a galactic war between two alien races.",
			poster_path: "/AtsgWhDnHTq68L0lLsUrCnM7TjG.jpg",
			backdrop_path: "/w2PMyoyLU22YvrGK3smVM9fW1jj.jpg",
			release_date: "2019-03-06",
			vote_average: 6.8,
			vote_count: 12420,
			genre_ids: [28, 12, 878],
			description: "The story follows Carol Danvers as she becomes one of the universe's most powerful heroes when Earth is caught in the middle of a galactic war between two alien races."
		},
		{
			id: 181808,
			title: "Star Wars: The Last Jedi",
			overview: "Rey develops her newly discovered abilities with the guidance of Luke Skywalker, who is unsettled by the strength of her powers.",
			poster_path: "/kOVEVeg59E0wsnXmF9nrh6OmWII.jpg",
			backdrop_path: "/5Iw7zQTHVRBOYpA0V6z0yypOPZh.jpg",
			release_date: "2017-12-13",
			vote_average: 7.0,
			vote_count: 14552,
			genre_ids: [28, 12, 14, 878],
			description: "Rey develops her newly discovered abilities with the guidance of Luke Skywalker, who is unsettled by the strength of her powers."
		}
	];

	const mockTVShows = [
		{
			id: 1399,
			name: "Game of Thrones",
			overview: "Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war.",
			poster_path: "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
			backdrop_path: "/suopoADq0k8YZr4dQXcU6pToj6s.jpg",
			first_air_date: "2011-04-17",
			vote_average: 8.3,
			vote_count: 22040,
			genre_ids: [18, 10765, 10759],
			description: "Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war."
		},
		{
			id: 1396,
			name: "Breaking Bad",
			overview: "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family's future.",
			poster_path: "/3xnWaLQjelJDDF7LT1WBo6f4BRe.jpg",
			backdrop_path: "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
			first_air_date: "2008-01-20",
			vote_average: 9.5,
			vote_count: 13172,
			genre_ids: [18, 80],
			description: "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family's future."
		},
		{
			id: 1668,
			name: "Friends",
			overview: "The misadventures of a group of friends as they navigate the pitfalls of work, life and love in Manhattan.",
			poster_path: "/2koX1xLkpTQM4IZebYvKysFW1Nh.jpg",
			backdrop_path: "/fDYla1yhAgJA7DQzJGf3fVnyUr6.jpg",
			first_air_date: "1994-09-22",
			vote_average: 8.4,
			vote_count: 6912,
			genre_ids: [35],
			description: "The misadventures of a group of friends as they navigate the pitfalls of work, life and love in Manhattan."
		}
	];

	const results = mediaType === 'tv' ? mockTVShows : mockMovies;
	
	// Filter based on query if provided
	if (query && query.trim()) {
		const filteredResults = results.filter(item => 
			(item as any).title?.toLowerCase().includes(query.toLowerCase()) ||
			(item as any).name?.toLowerCase().includes(query.toLowerCase()) ||
			item.overview.toLowerCase().includes(query.toLowerCase())
		);
		return filteredResults.length > 0 ? filteredResults : results.slice(0, 3);
	}
	
	return results.slice(0, 3);
};

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	try {
		// Rate limiting based on IP address
		const clientIP = getClientAddress();
		if (!checkRateLimit(clientIP, 30, 60000)) { // 30 requests per minute
			return json(
				{ error: 'Rate limit exceeded. Please wait before making more requests.' },
				{ status: 429, headers: { 'Retry-After': '60' } }
			);
		}

		const body = await request.json();

		// Validate request body exists
		if (!body || typeof body !== 'object') {
			return json(
				{ error: 'Invalid request body' },
				{ status: 400 }
			);
		}

		const {
			query: rawQuery,
			mediaType: rawMediaType,
			genres: rawGenres,
			platforms: rawPlatforms,
			minRating: rawMinRating,
			count: rawCount
		} = body;

		// Validate and sanitize inputs
		let query = '';
		if (rawQuery) {
			try {
				query = validateSearchQuery(rawQuery);
			} catch (error) {
				return json(
					{ error: 'Invalid search query' },
					{ status: 400 }
				);
			}
		}

		const mediaType = validateMediaType(rawMediaType);
		const genres = validateGenres(rawGenres);
		const platforms = validatePlatforms(rawPlatforms);
		const minRating = validateRating(rawMinRating);

		// Security: Validate and limit count parameter (max 5 for API cost control)
		const validatedCount = Math.min(Math.max(parseInt(rawCount) || 5, 1), 5);

		console.log('[getRecommendation] Validated request data:', { 
			query: query ? query.substring(0, 50) + '...' : 'none', 
			mediaType, 
			genresCount: genres.length, 
			platformsCount: platforms.length, 
			minRating, 
			count: validatedCount 
		});

		// Debug environment loading
		console.log('[getRecommendation] Environment check:', {
			hasTMDBKey: !!TMDB_API_KEY,
			keyLength: TMDB_API_KEY?.length,
			keyStart: TMDB_API_KEY?.substring(0, 8) + '...'
		});

		// Use the actual recommendation engine
		const results = await getRecommendations({
			query: query || 'any',
			mediaType: mediaType as 'movie' | 'tv',
			genres,
			platforms
		});

		console.log('[getRecommendation] Engine returned:', results.length, 'results');

		// Limit results to requested count
		const limitedResults = results.slice(0, validatedCount);

		// If no results, fallback to mock data to ensure functionality
		if (limitedResults.length === 0) {
			console.log('[getRecommendation] No results found, using mock data fallback');
			const mockResults = getMockRecommendations(query || 'any', mediaType);
			return json({
				success: true,
				data: {
					data: {
						results: mockResults.slice(0, validatedCount)
					}
				},
				source: 'mock',
				timestamp: new Date().toISOString()
			});
		}

		const result = {
			success: true,
			data: {
				data: {
					results: limitedResults
				}
			},
			source: 'api',
			timestamp: new Date().toISOString()
		};

		console.log('[getRecommendation] Returning results:', limitedResults.length, 'items');
		return json(result);

	} catch (error) {
		console.error('Recommendation error:', error);
		
		// Don't expose internal error details to clients
		const errorMessage = error instanceof Error && error.message.includes('Rate limit') 
			? error.message 
			: 'Failed to generate recommendations';

		return json(
			{
				error: errorMessage,
				timestamp: new Date().toISOString()
			},
			{ status: 500 }
		);
	}
};
