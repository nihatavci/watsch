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

// Expanded mock recommendations with variety and randomization
const getMockRecommendations = (query: string, mediaType: string) => {
	const allMockMovies = [
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
		},
		{
			id: 550,
			title: "Fight Club",
			overview: "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.",
			poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
			backdrop_path: "/52AfXWuXCHn3UjD17rBruA9f5qb.jpg",
			release_date: "1999-10-15",
			vote_average: 8.4,
			vote_count: 26280,
			genre_ids: [18],
			description: "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy."
		},
		{
			id: 13,
			title: "Forrest Gump",
			overview: "A man with a low IQ has accomplished great things in his life and been present during significant historic events.",
			poster_path: "/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
			backdrop_path: "/3h1JZGDhZ8nzxdgvkxha0qBqi05.jpg",
			release_date: "1994-06-23",
			vote_average: 8.5,
			vote_count: 26280,
			genre_ids: [35, 18, 10749],
			description: "A man with a low IQ has accomplished great things in his life and been present during significant historic events."
		},
		{
			id: 157336,
			title: "Interstellar",
			overview: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.",
			poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
			backdrop_path: "/bn6yw7fmNj5SdDpgKu8jNjGFP3e.jpg",
			release_date: "2014-11-07",
			vote_average: 8.5,
			vote_count: 31000,
			genre_ids: [12, 18, 878],
			description: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel."
		},
		{
			id: 680,
			title: "Pulp Fiction",
			overview: "A burger-loving hit man, his philosophical partner, a drug-addled gangster's moll and a washed-up boxer converge in this sprawling crime caper.",
			poster_path: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
			backdrop_path: "/dRZXoaJdhPx6u7uw8xNPJN6yiph.jpg",
			release_date: "1994-09-10",
			vote_average: 8.5,
			vote_count: 27000,
			genre_ids: [53, 80],
			description: "A burger-loving hit man, his philosophical partner, a drug-addled gangster's moll and a washed-up boxer converge in this sprawling crime caper."
		},
		{
			id: 278,
			title: "The Shawshank Redemption",
			overview: "Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison.",
			poster_path: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
			backdrop_path: "/iNh3BivHyg5sQRPP1KOkzguEX0H.jpg",
			release_date: "1994-09-23",
			vote_average: 8.7,
			vote_count: 26000,
			genre_ids: [18, 80],
			description: "Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison."
		}
	];

	const allMockTVShows = [
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
		},
		{
			id: 1408,
			name: "House",
			overview: "Dr. Gregory House is a maverick physician who is devoid of bedside manner. While his behavior can border on antisocial, Dr. House thrives on the challenge of solving the medical puzzles that other doctors give up on.",
			poster_path: "/3Cz7ySOQJmqiuTdrc6CY0r65yDI.jpg",
			backdrop_path: "/orFQbyeoF71cKwVbhf4fJTnpGMV.jpg",
			first_air_date: "2004-11-16",
			vote_average: 8.6,
			vote_count: 4500,
			genre_ids: [18, 9648],
			description: "Dr. Gregory House is a maverick physician who is devoid of bedside manner. While his behavior can border on antisocial, Dr. House thrives on the challenge of solving the medical puzzles that other doctors give up on."
		},
		{
			id: 60735,
			name: "The Flash",
			overview: "After a particle accelerator causes a freak storm, CSI Investigator Barry Allen is struck by lightning and falls into a coma.",
			poster_path: "/lJA2RCMfsWoskqlQhXPSLFQGXEJ.jpg",
			backdrop_path: "/9ypt6O9FZZQ7gGBptL7AfUK0eG7.jpg",
			first_air_date: "2014-10-07",
			vote_average: 7.7,
			vote_count: 8850,
			genre_ids: [18, 10765],
			description: "After a particle accelerator causes a freak storm, CSI Investigator Barry Allen is struck by lightning and falls into a coma."
		},
		{
			id: 1412,
			name: "The Office",
			overview: "The everyday lives of office employees in the Scranton, Pennsylvania branch of the fictional Dunder Mifflin Paper Company.",
			poster_path: "/qWnJzyZhyy74gjpSjIXWmuk0ifX.jpg",
			backdrop_path: "/7oKHWhDDh3zNcizSKhcsCSxVmqS.jpg",
			first_air_date: "2005-03-24",
			vote_average: 8.7,
			vote_count: 5400,
			genre_ids: [35],
			description: "The everyday lives of office employees in the Scranton, Pennsylvania branch of the fictional Dunder Mifflin Paper Company."
		},
		{
			id: 60059,
			name: "Better Call Saul",
			overview: "Six years before Saul Goodman meets Walter White. We meet him when the man who will become Saul Goodman is known as Jimmy McGill, a small-time lawyer searching for his destiny.",
			poster_path: "/dC6I7LZqeKFz4JqeVrywP5iCe2b.jpg",
			backdrop_path: "/bEowlHdCHr5Bx4j0pSX2aYSjpNu.jpg",
			first_air_date: "2015-02-08",
			vote_average: 8.5,
			vote_count: 4200,
			genre_ids: [18, 80],
			description: "Six years before Saul Goodman meets Walter White. We meet him when the man who will become Saul Goodman is known as Jimmy McGill, a small-time lawyer searching for his destiny."
		}
	];

	// Shuffle and return random selection
	const sourceArray = mediaType === 'tv' ? allMockTVShows : allMockMovies;
	const shuffled = [...sourceArray].sort(() => Math.random() - 0.5);
	
	// Filter based on query if provided
	if (query && query.trim() && query !== 'any') {
		const filteredResults = shuffled.filter(item => 
			(item as any).title?.toLowerCase().includes(query.toLowerCase()) ||
			(item as any).name?.toLowerCase().includes(query.toLowerCase()) ||
			item.overview.toLowerCase().includes(query.toLowerCase())
		);
		return filteredResults.length > 0 ? filteredResults.slice(0, 5) : shuffled.slice(0, 5);
	}
	
	return shuffled.slice(0, 5);
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

		// Debug environment loading - Security: No key exposure
		console.log('[getRecommendation] Environment check:', {
			hasTMDBKey: !!TMDB_API_KEY,
			keyConfigured: TMDB_API_KEY ? 'YES' : 'NO'
		});

		// Use the actual recommendation engine
		const results = await getRecommendations({
			query: query || 'any',
			mediaType: mediaType as 'movie' | 'tv',
			genres,
			platforms
		});

		console.log('[getRecommendation] Engine returned:', results.length, 'results');

		// Check if results contain mock data (titles starting with "Mock")
		const hasMockData = results.some(result => 
			result.title?.startsWith('Mock ') || 
			result.title?.includes('Mock Movie') ||
			result.title?.includes('Mock TV')
		);

		// If we got mock data from TMDB service, use the better mock data from recommendation engine
		if (hasMockData) {
			console.log('[getRecommendation] TMDB service returned mock data, using recommendation engine fallback');
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
