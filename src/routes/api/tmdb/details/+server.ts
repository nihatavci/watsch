import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDetails } from '$lib/api/tmdb';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const id = url.searchParams.get('id');
		const type = url.searchParams.get('type');
		const language = url.searchParams.get('language') || 'en-US';

		if (!id || !type) {
			return json({ error: 'Missing id or type parameter' }, { status: 400 });
		}

		console.log(`Fetching TMDB details for ${type} ${id}`);
		
		// Use the centralized TMDB API utility
		const data = await getDetails(id, type as 'movie' | 'tv', language);

		return json({
			id: data.id,
			title: data.title || data.name,
			overview: data.overview,
			type: type,
			year:
				data.release_date || data.first_air_date
					? new Date(data.release_date || data.first_air_date).getFullYear()
					: null,
			rating: Math.round(data.vote_average * 10),
			poster_path: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
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
