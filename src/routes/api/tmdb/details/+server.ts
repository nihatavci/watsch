import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { api } from '$lib/api';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const id = url.searchParams.get('id');
		const type = url.searchParams.get('type') || 'movie';
		
		if (!id) {
			return json({ error: 'ID parameter is required' }, { status: 400 });
		}

		const movieId = parseInt(id);
		if (isNaN(movieId)) {
			return json({ error: 'Invalid ID parameter' }, { status: 400 });
		}

		const apiManager = api.getInstance();
		
		let result;
		if (type === 'tv') {
			result = await apiManager.getTVDetails(movieId);
		} else {
			result = await apiManager.getMovieDetails(movieId);
		}

		return json({
			success: true,
			data: result,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error('TMDB details error:', error);
		return json(
			{ 
				error: 'Failed to get details',
				details: error instanceof Error ? error.message : 'Unknown error'
			}, 
			{ status: 500 }
		);
	}
};
