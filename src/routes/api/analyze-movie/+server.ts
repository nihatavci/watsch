import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { api } from '$lib/api';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { movieInfo } = await request.json();

		if (!movieInfo) {
			return json({ error: 'Movie info is required' }, { status: 400 });
		}

		const apiManager = api.getInstance();
		const result = await apiManager.analyzeContent(
			`Movie: ${movieInfo.title} (${movieInfo.release_date}) - ${movieInfo.overview}`,
			'movie analysis'
		);

		return json({
			success: true,
			data: result,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error('Movie analysis error:', error);
		return json(
			{ 
				error: 'Failed to analyze movie',
				details: error instanceof Error ? error.message : 'Unknown error'
			}, 
			{ status: 500 }
		);
	}
};
