import { json } from '@sveltejs/kit';
import { TMDB_API_KEY } from '$env/static/private';
import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ request }: RequestEvent) {
	try {
		const { id, type } = await request.json();
		
		const mediaType = type === 'tv' ? 'tv' : 'movie';
		const url = `https://api.themoviedb.org/3/${mediaType}/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits`;
		
		const response = await fetch(url);
		const data = await response.json();
		
		if (!response.ok) {
			throw new Error(data.status_message || 'Failed to fetch details from TMDB');
		}
		
		return json(data);
	} catch (error) {
		console.error('TMDB details error:', error);
		return json({ error: error instanceof Error ? error.message : 'Failed to fetch details' }, { status: 500 });
	}
} 