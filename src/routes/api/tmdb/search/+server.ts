import { TMDB_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { title, type } = await request.json();
		
		const response = await fetch(
			`https://api.themoviedb.org/3/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=en-US&page=1&include_adult=false`
		);

		const data = await response.json();

		if (!response.ok) {
			console.error('TMDB API Error:', data);
			return json({ results: [] });
		}

		return json(data);
	} catch (error) {
		console.error('Search error:', error);
		return json({ results: [] });
	}
}; 