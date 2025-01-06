import { TMDB_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { title, type } = await request.json();
		
		console.log('TMDB Search:', { title, type }); // Debug log

		const response = await fetch(
			`https://api.themoviedb.org/3/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=en-US&page=1&include_adult=false`
		);

		const data = await response.json();

		// Debug log
		console.log('TMDB Response:', {
			status: response.status,
			resultCount: data.results?.length || 0
		});

		if (!response.ok) {
			console.error('TMDB API Error:', data);
			throw new Error(data.status_message || 'Failed to fetch from TMDB');
		}

		return json(data);
	} catch (error) {
		console.error('Search error:', error);
		return new Response(JSON.stringify({ 
			error: error instanceof Error ? error.message : 'Internal server error' 
		}), {
			status: 500
		});
	}
}; 