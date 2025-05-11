import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TMDB_API_KEY, OPENAI_API_KEY } from '$lib/env-loader';
import { callOpenAI } from '$lib/api/openai';

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

export const POST: RequestHandler = async ({ request, fetch }) => {
	try {
		const { searched, preferences } = await request.json();
		console.log('Received search request:', searched);
		console.log('User preferences:', preferences);

		if (!searched) {
			console.error('No search criteria provided');
			return json({ error: 'No search criteria provided' }, { status: 400 });
		}

		// Extract basic search parameters
		const [mediaType, ...rest] = searched.split(',').map((s: string) => s.trim());

		if (!mediaType || !['movie', 'tv'].includes(mediaType)) {
			console.error('Invalid media type:', mediaType);
			return json({ error: 'Invalid media type. Must be "movie" or "tv".' }, { status: 400 });
		}

		// Parse genres and platforms from the searched string
		const genres = rest.filter((item: string) => !item.startsWith(' on '));
		const platforms =
			rest
				.find((item: string) => item.startsWith(' on '))
				?.replace(' on ', '')
				.split(',')
				.map((p: string) => p.trim()) || [];

		console.log('Parsed request:', { mediaType, genres, platforms, preferences });

		// Validate TMDB API key
		if (!TMDB_API_KEY) {
			console.error('TMDB API key not found');
			return json({ error: 'TMDB API key not configured' }, { status: 500 });
		}

		// Process user preferences with AI if available
		const enhancedQueryParams: EnhancedQueryParams = {};
		let searchYear: number | null = null;
		let excludeGenres: string[] = [];
		let includeActors: string[] = [];
		let includeKeywords: string[] = [];
		let actorIds: number[] = []; // Will store actor IDs after lookup

		// Part 1: Process preferences with OpenAI if available
		if (preferences && OPENAI_API_KEY) {
			try {
				// Use OpenAI to analyze the user preferences
				console.log('Processing preferences with AI...');
				const aiResponse = await callOpenAI(
					'chat/completions',
					{
						model: 'gpt-3.5-turbo',
						messages: [
							{
								role: 'system',
								content: `You are an API translation assistant. Convert the user's movie/TV show preferences into structured TMDB API parameters.
							
							Analyze their preferences and respond ONLY with a JSON object containing these fields:
							- year: numeric (four-digit year) or null if not specified
							- decade: string (e.g., "1980s") or null if not specified
							- release_date.gte: YYYY-MM-DD format or null (for "after X year")
							- release_date.lte: YYYY-MM-DD format or null (for "before X year")
							- with_people: array of actor/director names
							- with_keywords: array of content-related keywords (themes, subjects, etc.)
							- without_genres: array of genre names to exclude
							- sort_by: valid TMDB sorting parameter (popularity.desc, vote_average.desc, etc.)
							- vote_average.gte: minimum rating (0-10) or null
							- include_adult: boolean (true for adult content)
							
							Return ONLY the JSON. No explanations.`
							},
							{
								role: 'user',
								content: preferences
							}
						],
						temperature: 0.3,
						max_tokens: 300
					},
					fetch
				);

				if (aiResponse.choices && aiResponse.choices[0]?.message?.content) {
					try {
						// Parse the AI response
						const aiParams = JSON.parse(aiResponse.choices[0].message.content);
						console.log('AI-processed parameters:', aiParams);

						// Convert AI parameters to TMDB API parameters
						if (aiParams.year) {
							searchYear = parseInt(aiParams.year);
						}

						if (aiParams.decade) {
							const decadeMatch = aiParams.decade.match(/(\d{4})s/);
							if (decadeMatch) {
								const startYear = decadeMatch[1];
								enhancedQueryParams['primary_release_date.gte'] = `${startYear}-01-01`;
								enhancedQueryParams['primary_release_date.lte'] = `${
									parseInt(startYear) + 9
								}-12-31`;
							}
						}

						if (aiParams['release_date.gte']) {
							enhancedQueryParams['primary_release_date.gte'] = aiParams['release_date.gte'];
						}

						if (aiParams['release_date.lte']) {
							enhancedQueryParams['primary_release_date.lte'] = aiParams['release_date.lte'];
						}

						if (aiParams.with_people && aiParams.with_people.length > 0) {
							includeActors = aiParams.with_people;
						}

						if (aiParams.with_keywords && aiParams.with_keywords.length > 0) {
							includeKeywords = aiParams.with_keywords;
						}

						if (aiParams.without_genres && aiParams.without_genres.length > 0) {
							excludeGenres = aiParams.without_genres;
						}

						if (aiParams.sort_by) {
							enhancedQueryParams['sort_by'] = aiParams.sort_by;
						}

						if (aiParams['vote_average.gte']) {
							enhancedQueryParams['vote_average.gte'] = aiParams['vote_average.gte'].toString();
						}

						if (aiParams.include_adult !== undefined) {
							enhancedQueryParams['include_adult'] = aiParams.include_adult.toString();
						}
					} catch (parseError) {
						console.error('Error parsing AI response:', parseError);
						// Continue with default parameters
					}
				}
			} catch (aiError) {
				console.error('Error processing preferences with AI:', aiError);
				// Continue with default parameters
			}
		}

		// Part 2: Look up actor IDs if we have actor names
		if (includeActors.length > 0) {
			try {
				for (const actor of includeActors) {
					console.log(`Looking up person ID for: ${actor}`);
					const personSearchUrl = new URL('https://api.themoviedb.org/3/search/person');
					personSearchUrl.searchParams.append('api_key', TMDB_API_KEY);
					personSearchUrl.searchParams.append('query', actor);
					personSearchUrl.searchParams.append('language', 'en-US');

					const personResponse = await fetch(personSearchUrl.toString());

					if (!personResponse.ok) {
						console.error(`Error searching for person "${actor}":`, personResponse.statusText);
						continue;
					}

					const personData = await personResponse.json();

					if (personData.results && personData.results.length > 0) {
						const personResult = personData.results[0] as PersonSearchResult;
						actorIds.push(personResult.id);
						console.log(
							`Found person ID for "${actor}": ${personResult.id} (${personResult.name})`
						);
					} else {
						console.log(`No results found for person "${actor}"`);
					}
				}
			} catch (error) {
				console.error('Error looking up actor IDs:', error);
				// Continue with other parameters even if actor lookup fails
			}
		}

		// Select genre map based on media type
		const genreMap = mediaType === 'tv' ? TV_GENRE_MAP : GENRE_MAP;

		// Get genre IDs from user selection
		const genreIds = genres
			.map((genre: string) => genreMap[genre])
			.filter((id: number | undefined): id is number => id !== undefined);

		// If AI identified genres to exclude, process them
		const excludeGenreIds = excludeGenres
			.map((genre: string) => genreMap[genre])
			.filter((id: number | undefined): id is number => id !== undefined);

		// Part 3: Build our initial discovery query
		const url = new URL(`https://api.themoviedb.org/3/discover/${mediaType}`);
		url.searchParams.append('api_key', TMDB_API_KEY);
		url.searchParams.append('language', 'en-US');
		url.searchParams.append('sort_by', enhancedQueryParams['sort_by'] || 'popularity.desc');
		url.searchParams.append('include_adult', enhancedQueryParams['include_adult'] || 'false');
		url.searchParams.append('page', '1');

		// Add genre filtering
		if (genreIds.length > 0) {
			url.searchParams.append('with_genres', genreIds.join(','));
		}

		// Add genres to exclude
		if (excludeGenreIds.length > 0) {
			url.searchParams.append('without_genres', excludeGenreIds.join(','));
		}

		// Add year if specified
		if (searchYear) {
			if (mediaType === 'movie') {
				url.searchParams.append('primary_release_year', searchYear.toString());
			} else {
				url.searchParams.append('first_air_date_year', searchYear.toString());
			}
		}

		// Add date range parameters if specified
		if (enhancedQueryParams['primary_release_date.gte']) {
			url.searchParams.append(
				mediaType === 'movie' ? 'primary_release_date.gte' : 'first_air_date.gte',
				enhancedQueryParams['primary_release_date.gte']
			);
		}

		if (enhancedQueryParams['primary_release_date.lte']) {
			url.searchParams.append(
				mediaType === 'movie' ? 'primary_release_date.lte' : 'first_air_date.lte',
				enhancedQueryParams['primary_release_date.lte']
			);
		}

		// Add vote average if specified
		if (enhancedQueryParams['vote_average.gte']) {
			url.searchParams.append('vote_average.gte', enhancedQueryParams['vote_average.gte']);
		}

		// Add actor IDs if we found any
		if (actorIds.length > 0) {
			url.searchParams.append('with_people', actorIds.join('|'));
			console.log(`Added actors to search: ${actorIds.join('|')}`);
		}

		// Add keywords if specified (would normally require keyword ID lookup)
		if (includeKeywords.length > 0) {
			console.log(`Keyword search terms (not ID-based): ${includeKeywords.join(', ')}`);
			// We would need to do keyword ID lookup here for proper filtering
			// For now, we'll keep this commented out as keywords require IDs
			// url.searchParams.append('with_keywords', keywordIds.join(','));
		}

		console.log('Fetching from TMDB:', url.toString());

		// Fetch results from primary search
		let data;
		let response = await fetch(url.toString());

		if (!response.ok) {
			console.error('TMDB API Error:', {
				status: response.status,
				statusText: response.statusText
			});

			// Continue with a fallback approach
			data = { results: [] };
		} else {
			data = await response.json();
		}

		// Part 4: If no results and we have actors, try actor-only search
		if ((!data.results || data.results.length === 0) && actorIds.length > 0) {
			console.log('No results from combined search, trying actor-only search...');

			// Create a backup search with just actor IDs
			const backupUrl = new URL(`https://api.themoviedb.org/3/discover/${mediaType}`);
			backupUrl.searchParams.append('api_key', TMDB_API_KEY);
			backupUrl.searchParams.append('language', 'en-US');
			backupUrl.searchParams.append('sort_by', 'popularity.desc');
			backupUrl.searchParams.append('include_adult', 'false');
			backupUrl.searchParams.append('with_people', actorIds.join('|'));

			console.log('Backup actor search URL:', backupUrl.toString());

			const backupResponse = await fetch(backupUrl.toString());

			if (backupResponse.ok) {
				const backupData = await backupResponse.json();
				if (backupData.results && backupData.results.length > 0) {
					console.log(`Found ${backupData.results.length} results with actor-only search`);
					data = backupData;
				}
			}
		}

		// Part 5: If still no results and we tried actor search, try one more approach with person credits API
		if ((!data.results || data.results.length === 0) && actorIds.length > 0) {
			console.log('No results from discovery search, trying person credits API...');

			// Use the first actor ID we found
			const actorId = actorIds[0];
			const creditsUrl = new URL(
				`https://api.themoviedb.org/3/person/${actorId}/${mediaType}_credits`
			);
			creditsUrl.searchParams.append('api_key', TMDB_API_KEY);
			creditsUrl.searchParams.append('language', 'en-US');

			console.log('Person credits search URL:', creditsUrl.toString());

			const creditsResponse = await fetch(creditsUrl.toString());

			if (creditsResponse.ok) {
				const creditsData = await creditsResponse.json();
				if (creditsData.cast && creditsData.cast.length > 0) {
					console.log(`Found ${creditsData.cast.length} results with person credits API`);

					// Filter by genre if we have genre IDs
					let filteredCast = creditsData.cast;
					if (genreIds.length > 0) {
						filteredCast = creditsData.cast.filter((item: any) => {
							if (!item.genre_ids) return false;
							return genreIds.some((genreId: number) => item.genre_ids.includes(genreId));
						});
					}

					// Sort by popularity
					filteredCast.sort((a: any, b: any) => b.popularity - a.popularity);

					// If we found something, use this data instead
					if (filteredCast.length > 0) {
						data = { results: filteredCast };
					}
				}
			}
		}

		// Part 6: Process our results or return error
		if (!data.results || data.results.length === 0) {
			console.log('No results found after all attempts');

			// Provide more specific error message based on search parameters
			let errorMessage = 'No movies found matching your criteria';
			if (actorIds.length > 0 && genreIds.length > 0) {
				errorMessage = `No ${
					mediaType === 'movie' ? 'movies' : 'TV shows'
				} found with the selected actor and genres. Try removing some genres for more results.`;
			} else if (actorIds.length > 0) {
				errorMessage = `No ${
					mediaType === 'movie' ? 'movies' : 'TV shows'
				} found with the specified actor.`;
			}

			return json({ error: errorMessage }, { status: 404 });
		}

		// Process and return recommendations
		const recommendations = data.results
			.slice(0, 5)
			.map((item: any) => {
				try {
					return {
						id: item.id,
						title: item.title || item.name,
						description: item.overview,
						type: mediaType,
						year:
							item.release_date || item.first_air_date
								? new Date(item.release_date || item.first_air_date).getFullYear()
								: null,
						rating: Math.round(item.vote_average * 10),
						poster_path: item.poster_path
							? `https://image.tmdb.org/t/p/w500${item.poster_path}`
							: null,
						backdrop_path: item.backdrop_path
							? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
							: null,
						popularity: item.popularity,
						genre_ids: item.genre_ids,
						original_language: item.original_language?.toUpperCase()
					};
				} catch (err) {
					console.error('Error processing item:', err, item);
					return null;
				}
			})
			.filter(Boolean);

		console.log('Processed recommendations:', {
			count: recommendations.length,
			titles: recommendations.map((r: any) => r.title)
		});

		return json(recommendations);
	} catch (error) {
		console.error('Error in getRecommendation:', error);
		return json(
			{
				error: error instanceof Error ? error.message : 'Failed to get recommendations',
				details: error instanceof Error ? error.stack : undefined
			},
			{ status: 500 }
		);
	}
};
