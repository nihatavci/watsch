import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getEnvVariables } from '$lib/env';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const id = url.searchParams.get('id');
		const type = url.searchParams.get('type');
		const language = url.searchParams.get('language') || 'en-US';

		if (!id || !type) {
			return json({ error: 'Missing id or type parameter' }, { status: 400 });
		}

		const env = await getEnvVariables();

		if (!env.TMDB_API_KEY) {
			console.error('TMDB API key not found');
			return json({ error: 'TMDB API key not configured' }, { status: 500 });
		}

		const apiUrl = `https://api.themoviedb.org/3/${type}/${id}?api_key=${env.TMDB_API_KEY}&language=${language}`;
		console.log('Fetching TMDB details:', apiUrl);

		const response = await fetch(apiUrl, {
			headers: {
				'accept': 'application/json'
			}
		});
		
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

		return json({
			id: data.id,
			title: data.title || data.name,
			overview: data.overview,
			type: type,
			year: data.release_date || data.first_air_date
				? new Date(data.release_date || data.first_air_date).getFullYear()
				: null,
			rating: Math.round(data.vote_average * 10),
			poster_path: data.poster_path
				? `https://image.tmdb.org/t/p/w500${data.poster_path}`
				: null,
			backdrop_path: data.backdrop_path
				? `https://image.tmdb.org/t/p/original${data.backdrop_path}`
				: null,
			genres: data.genres,
			runtime: data.runtime || (data.episode_run_time && data.episode_run_time[0]),
			status: data.status,
			original_language: data.original_language?.toUpperCase()
		});
	} catch (error) {
		console.error('Error in TMDB details endpoint:', error);
		return json(
			{
				error: error instanceof Error ? error.message : 'Failed to get TMDB details',
				details: error instanceof Error ? error.stack : undefined
			},
			{ status: 500 }
		);
	}
}; 