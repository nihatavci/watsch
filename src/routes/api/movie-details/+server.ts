import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TMDB_API_KEY } from '$env/static/private';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const title = url.searchParams.get('title');
		if (!title) {
			return json({ error: 'Title is required' }, { status: 400 });
		}

		// Search for the movie
		const searchResponse = await fetch(
			`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&page=1`
		);

		if (!searchResponse.ok) {
			throw new Error('Failed to fetch from TMDB');
		}

		const searchData = await searchResponse.json();
		const firstResult = searchData.results[0];

		if (!firstResult) {
			return json({
				title,
				poster_path: null,
				backdrop_path: null,
				vote_average: null,
				release_date: null
			});
		}

		return json({
			title: firstResult.title || firstResult.name,
			poster_path: firstResult.poster_path,
			backdrop_path: firstResult.backdrop_path,
			vote_average: firstResult.vote_average,
			release_date: firstResult.release_date || firstResult.first_air_date
		});
	} catch (error) {
		console.error('Error fetching movie details:', error);
		return json({ error: 'Failed to fetch movie details' }, { status: 500 });
	}
}; 