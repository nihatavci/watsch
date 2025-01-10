import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TMDB_API_KEY } from '$env/static/private';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { tmdbId, type } = await request.json();

        // Fetch watch providers from TMDB
        const response = await fetch(
            `https://api.themoviedb.org/3/${type}/${tmdbId}/watch/providers?api_key=${TMDB_API_KEY}`
        );

        if (!response.ok) {
            console.error('TMDB API error:', await response.text());
            return json({ streamingLinks: [] });
        }

        const data = await response.json();
        const streamingLinks = [];

        // Get US providers (or fallback to first available region)
        const regions = data.results || {};
        const providers = regions.US || Object.values(regions)[0];

        if (providers) {
            // Add subscription streaming services first
            if (providers.flatrate) {
                // Look for Netflix with region-specific URL
                const netflix = providers.flatrate.find(
                    (provider: any) => provider.provider_name === 'Netflix'
                );

                if (netflix && providers.link) {
                    // Extract Netflix URL from JustWatch if possible
                    const justWatchUrl = providers.link;
                    if (justWatchUrl.includes('netflix.com')) {
                        streamingLinks.push({
                            platform: 'Netflix',
                            type: 'subscription',
                            url: justWatchUrl,
                            logo: `https://image.tmdb.org/t/p/original${netflix.logo_path}`
                        });
                    }
                }
            }

            // Add JustWatch link if available
            if (providers.link) {
                streamingLinks.push({
                    platform: 'All Streaming Options',
                    type: 'all',
                    url: providers.link,
                    logo: 'https://www.justwatch.com/appassets/img/logo/JustWatch-logo-large.png'
                });
            }
        }

        return json({ streamingLinks });
    } catch (error) {
        console.error('Error fetching streaming availability:', error);
        return json({ streamingLinks: [] });
    }
}; 