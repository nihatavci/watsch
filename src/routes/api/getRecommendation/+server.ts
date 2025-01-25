import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getEnvVariables } from '$lib/env';

type GenreMap = {
	[key: string]: number;
};

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

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { searched } = await request.json();
		console.log('Received search request:', searched);

		if (!searched) {
			console.error('No search criteria provided');
			return json({ error: 'No search criteria provided' }, { status: 400 });
		}

		const [mediaType, ...rest] = searched.split(',').map((s: string) => s.trim());

		if (!mediaType || !['movie', 'tv'].includes(mediaType)) {
			console.error('Invalid media type:', mediaType);
			return json({ error: 'Invalid media type. Must be "movie" or "tv".' }, { status: 400 });
		}

		const genres = rest.filter((item: string) => !item.startsWith(' on '));
		const platforms = rest
			.find((item: string) => item.startsWith(' on '))
			?.replace(' on ', '')
			.split(',')
			.map((p: string) => p.trim()) || [];

		console.log('Parsed request:', { mediaType, genres, platforms });

		const genreMap = mediaType === 'tv' ? TV_GENRE_MAP : GENRE_MAP;
		const genreIds = genres
			.map((genre: string) => genreMap[genre])
			.filter((id: number | undefined): id is number => id !== undefined);

		const env = await getEnvVariables();
		const TMDB_API_KEY = env.TMDB_API_KEY;

		if (!TMDB_API_KEY) {
			console.error('TMDB API key not found');
			return json({ error: 'TMDB API key not configured' }, { status: 500 });
		}

		const url = new URL(`https://api.themoviedb.org/3/discover/${mediaType}`);
		url.searchParams.append('api_key', TMDB_API_KEY);
		url.searchParams.append('language', 'en-US');
		url.searchParams.append('sort_by', 'popularity.desc');
		url.searchParams.append('include_adult', 'false');
		url.searchParams.append('page', '1');
		
		if (genreIds.length > 0) {
			url.searchParams.append('with_genres', genreIds.join(','));
		}

		console.log('Fetching from TMDB:', url.toString());

		const response = await fetch(url.toString());
		const data = await response.json();

		if (!response.ok) {
			console.error('TMDB API Error:', {
				status: response.status,
				statusText: response.statusText,
				data
			});
			return json(
				{
					error: data.status_message || 'Failed to fetch from TMDB',
					details: data
				},
				{ status: response.status }
			);
		}

		if (!data.results || data.results.length === 0) {
			console.log('No results found');
			return json({ error: 'No movies found matching your criteria' }, { status: 404 });
		}

		const recommendations = data.results.slice(0, 5).map((item: any) => {
			try {
				return {
					id: item.id,
					title: item.title || item.name,
					description: item.overview,
					type: mediaType,
					year: item.release_date || item.first_air_date
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
		}).filter(Boolean);

		console.log('Processed recommendations:', {
			count: recommendations.length,
			titles: recommendations.map(r => r.title)
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