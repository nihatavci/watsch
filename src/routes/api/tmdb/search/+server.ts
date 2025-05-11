import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getEnvVariables } from '$lib/env';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const title = url.searchParams.get('title');
		const type = url.searchParams.get('type')?.toLowerCase() || 'movie';
		const language = url.searchParams.get('language') || 'en-US';

		if (!title) {
			return json({ error: 'Missing title parameter' }, { status: 400 });
		}

		const env = await getEnvVariables();

		if (!env.TMDB_API_KEY) {
			console.error('TMDB API key not found');
			return json({ error: 'TMDB API key not configured' }, { status: 500 });
		}

		console.log('TMDB Search:', { title, type }); // Debug log

		// First try with specific type
		let response = await fetch(
			`https://api.themoviedb.org/3/search/${type}?api_key=${
				env.TMDB_API_KEY
			}&query=${encodeURIComponent(title)}&language=${language}&page=1&include_adult=false`,
			{
				headers: {
					accept: 'application/json'
				}
			}
		);

		let data = await response.json();

		// If no results found and searching for a movie, try TV shows and vice versa
		if ((!data.results || data.results.length === 0) && type === 'movie') {
			console.log('No movie results found, trying TV shows');
			response = await fetch(
				`https://api.themoviedb.org/3/search/tv?api_key=${
					env.TMDB_API_KEY
				}&query=${encodeURIComponent(title)}&language=${language}&page=1&include_adult=false`,
				{
					headers: {
						accept: 'application/json'
					}
				}
			);
			data = await response.json();
			if (data.results?.length > 0) {
				data.results = data.results.map((item: any) => ({
					...item,
					media_type: 'tv'
				}));
			}
		} else if ((!data.results || data.results.length === 0) && type === 'tv') {
			console.log('No TV results found, trying movies');
			response = await fetch(
				`https://api.themoviedb.org/3/search/movie?api_key=${
					env.TMDB_API_KEY
				}&query=${encodeURIComponent(title)}&language=${language}&page=1&include_adult=false`,
				{
					headers: {
						accept: 'application/json'
					}
				}
			);
			data = await response.json();
			if (data.results?.length > 0) {
				data.results = data.results.map((item: any) => ({
					...item,
					media_type: 'movie'
				}));
			}
		}

		// Debug log
		console.log('TMDB Response:', {
			status: response.status,
			resultCount: data.results?.length || 0,
			firstResult: data.results?.[0]
		});

		if (!response.ok) {
			console.error('TMDB API Error:', data);
			throw new Error(data.status_message || 'Failed to fetch from TMDB');
		}

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
