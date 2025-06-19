import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { api } from '$lib/api';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const query = url.searchParams.get('query');
		const type = url.searchParams.get('type') || 'movie';
		const page = parseInt(url.searchParams.get('page') || '1');
		
		if (!query) {
			return json({ error: 'Query parameter is required' }, { status: 400 });
		}

		const apiManager = api.getInstance();
		
		let result;
		if (type === 'tv') {
			result = await apiManager.searchTV(query, page);
		} else {
			result = await apiManager.searchMovies(query, page);
		}

		return json({
			success: true,
			data: result,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error('TMDB search error:', error);
		return json(
			{ 
				error: 'TMDB search failed',
				details: error instanceof Error ? error.message : 'Unknown error'
			}, 
			{ status: 500 }
		);
	}
};
