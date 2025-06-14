import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getStreamingProviders } from '$lib/api/tmdb';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { tmdbId, type } = await request.json();

		if (!tmdbId || !type) {
			return json({ error: 'Missing required parameters' }, { status: 400 });
		}

		console.log(`Fetching streaming availability for ${type} ${tmdbId}`);
		
		// Use the centralized TMDB API utility
		const data = await getStreamingProviders(tmdbId, type as 'movie' | 'tv');
		const results = data.results?.US;

		if (!results) {
			return json({ streamingLinks: [] });
		}

		const streamingLinks = [
			...(results.flatrate || []),
			...(results.free || []),
			...(results.ads || [])
		].map((provider) => ({
			platform: provider.provider_name,
			url: results.link,
			type: 'stream'
		}));

		return json({ streamingLinks });
	} catch (error) {
		console.error('Error fetching streaming availability:', error);
		return json(
			{
				error: error instanceof Error ? error.message : 'Failed to fetch streaming availability'
			},
			{ status: 500 }
		);
	}
};
