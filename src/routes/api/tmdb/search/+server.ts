import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchTMDB } from '$lib/api/tmdb';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const title = url.searchParams.get('title');
		const type = url.searchParams.get('type')?.toLowerCase() || 'movie';
		const language = url.searchParams.get('language') || 'en-US';

		if (!title) {
			return json({ error: 'Missing title parameter' }, { status: 400 });
		}

		console.log('TMDB Search:', { title, type }); // Debug log

		// Use the centralized TMDB API utility
		let data = await searchTMDB(title, type as 'movie' | 'tv', language);

		// If no results found and searching for a movie, try TV shows and vice versa
		if ((!data.results || data.results.length === 0) && type === 'movie') {
			console.log('No movie results found, trying TV shows');
			data = await searchTMDB(title, 'tv', language);
			if (data.results?.length > 0) {
				data.results = data.results.map((item: any) => ({
					...item,
					media_type: 'tv'
				}));
			}
		} else if ((!data.results || data.results.length === 0) && type === 'tv') {
			console.log('No TV results found, trying movies');
			data = await searchTMDB(title, 'movie', language);
			if (data.results?.length > 0) {
				data.results = data.results.map((item: any) => ({
					...item,
					media_type: 'movie'
				}));
			}
		}

		// Debug log
		console.log('TMDB Response:', {
			resultCount: data.results?.length || 0,
			firstResult: data.results?.[0]
		});

		// Add media_type to results if not present
		if (data.results) {
			data.results = data.results.map((item: any) => ({
				...item,
				media_type: item.media_type || type
			}));
		}

		return json(data);
	} catch (error) {
		console.error('Search error:', error);
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : 'Internal server error'
			}),
			{
				status: 500
			}
		);
	}
};
