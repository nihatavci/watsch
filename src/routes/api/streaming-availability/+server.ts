import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { TMDB_API_KEY } from '$lib/env-loader';
import { ApiManager } from '$lib/api';

export const GET = async ({ url }: RequestEvent) => {
	try {
		const id = url.searchParams.get('id');
		const type = url.searchParams.get('type') || 'movie';
		
		if (!id) {
			return json({ error: 'Movie/TV ID is required' }, { status: 400 });
		}

		// Check TMDB API key availability
		if (!TMDB_API_KEY) {
			console.warn('[API Route] TMDB API key not found - using mock data for development');
			return json({ 
				error: 'TMDB service unavailable in development mode', 
				message: 'Please configure TMDB_API_KEY environment variable for full functionality',
				mockMode: true 
			}, { status: 503 });
		}

		// Initialize API manager
		const apiManager = ApiManager.getInstance();
		
		try {
			// Initialize the API manager if needed
			if (!apiManager.getHealth().initialized) {
				await apiManager.initialize({
					TMDB_API_KEY: TMDB_API_KEY
				});
			}

			// Use the new API system to get watch providers
			const providers = await apiManager.getWatchProviders(parseInt(id), type as 'movie' | 'tv');

			return json({ 
				providers,
				mockMode: false
			});

		} catch (apiError) {
			console.error('[API Route] Error with TMDB service:', apiError);
			return json({
				error: 'TMDB service temporarily unavailable',
				message: 'The streaming availability system is being updated. Please try again later.',
				mockMode: true
			}, { status: 503 });
		}

	} catch (error) {
		console.error('[API Route] Error in streaming-availability handler:', error);
		return json(
			{
				error: error instanceof Error ? error.message : 'Failed to get streaming availability',
				details: error instanceof Error ? error.stack : undefined
			},
			{ status: 500 }
		);
	}
};
