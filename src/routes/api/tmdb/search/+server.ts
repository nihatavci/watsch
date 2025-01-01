import { json } from '@sveltejs/kit';
import { TMDB_API_KEY } from '$env/static/private';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ request }: RequestEvent) {
	try {
		const { title, type } = await request.json();
		
		const searchType = type === 'tv' ? 'tv' : 'movie';
		const url = `https://api.themoviedb.org/3/search/${searchType}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
		
		const response = await fetch(url);
		const data = await response.json();
		
		if (!response.ok) {
			throw new Error(data.status_message || 'Failed to search TMDB');
		}
		
		return json(data);
	} catch (error) {
		console.error('TMDB search error:', error);
		return json({ error: error instanceof Error ? error.message : 'Failed to search media' }, { status: 500 });
	}
} 