import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getEnvVariables } from '$lib/env';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { tmdbId, type } = await request.json();
        const env = await getEnvVariables();

        if (!tmdbId || !type) {
            return json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const response = await fetch(
            `https://api.themoviedb.org/3/${type}/${tmdbId}/watch/providers?api_key=${env.TMDB_API_KEY}`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch streaming providers');
        }

        const data = await response.json();
        const results = data.results?.US;

        if (!results) {
            return json({ streamingLinks: [] });
        }

        const streamingLinks = [
            ...(results.flatrate || []),
            ...(results.free || []),
            ...(results.ads || [])
        ].map(provider => ({
            platform: provider.provider_name,
            url: results.link,
            type: 'stream'
        }));

        return json({ streamingLinks });
    } catch (error) {
        console.error('Error fetching streaming availability:', error);
        return json({ 
            error: error instanceof Error ? error.message : 'Failed to fetch streaming availability' 
        }, { status: 500 });
    }
}; 