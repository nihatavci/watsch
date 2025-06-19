import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { api } from '$lib/api';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { prompt, type = 'movie' } = await request.json();

		if (!prompt) {
			return json({ error: 'Prompt is required' }, { status: 400 });
		}

		const apiManager = api.getInstance();
		const result = await apiManager.generateRecommendations(prompt, 5);

		return json({
			success: true,
			data: result,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error('Automated prompt error:', error);
		return json(
			{ 
				error: 'Failed to generate recommendations',
				details: error instanceof Error ? error.message : 'Unknown error'
			}, 
			{ status: 500 }
		);
	}
};
