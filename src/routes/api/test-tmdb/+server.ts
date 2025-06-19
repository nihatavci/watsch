import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { api } from '$lib/api';

export const GET: RequestHandler = async () => {
	try {
		const apiManager = api.getInstance();
		const health = apiManager.getHealth();
		
		return json({
			success: true,
			data: {
				tmdbConfigured: health.services?.tmdb || false,
				apiInitialized: health.initialized || false,
				status: health.status || 'unknown'
			},
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error('TMDB test error:', error);
		return json(
			{ 
				error: 'Failed to test TMDB configuration',
				details: error instanceof Error ? error.message : 'Unknown error'
			}, 
			{ status: 500 }
		);
	}
};

export const POST: RequestHandler = async () => {
	try {
		// Simply call the GET handler
		return await GET({
			url: new URL('http://localhost/api/test-tmdb') 
		} as any);
	} catch (error) {
		console.error('Test error:', error);
		return json(
			{
				error: error instanceof Error ? error.message : 'Internal server error'
			},
			{ status: 500 }
		);
	}
};
