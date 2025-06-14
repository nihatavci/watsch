import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OMDB_API_KEY } from '$lib/env-loader';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { title } = await request.json();
		if (!title) {
			console.error('[Error] Title is required');
			return json({ error: 'Title is required' }, { status: 400 });
		}
		console.log('[Debug] OMDB_API_KEY:', OMDB_API_KEY ? OMDB_API_KEY.substring(0, 8) + '...' : 'NOT SET');
		if (!OMDB_API_KEY) {
			console.error('[Error] OMDB_API_KEY is not configured');
			console.log('Available environment variables:', Object.keys(env));
			return json({
				error: 'API configuration error',
				details: 'OMDB_API_KEY is missing from environment variables'
			}, { status: 500 });
		}
		const maxRetries = 3;
		let lastError;
		for (let i = 0; i < maxRetries; i++) {
			try {
				const response = await fetch(
					`https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${OMDB_API_KEY}`
				);
				if (!response.ok) {
					const text = await response.text();
					console.error('[Error] OMDB fetch failed:', response.status, response.statusText, text);
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				const data = await response.json();
				if (data.Error === 'Invalid API key!') {
					console.error('[Error] OMDB API key validation failed');
					return json({ error: 'API authentication failed' }, { status: 401 });
				}
				if (data.Error) {
					console.error('[Error] OMDB API returned error:', data.Error);
					return json({ error: data.Error }, { status: 404 });
				}
				return json(data);
			} catch (error) {
				lastError = error;
				console.error('[Error] OMDB fetch exception:', error);
				await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
			}
		}
		console.error('[Error] Failed after retries:', lastError);
		return json({ error: 'Service temporarily unavailable', details: lastError instanceof Error ? lastError.stack : lastError }, { status: 503 });
	} catch (error) {
		console.error('[API Error]:', error);
		return json({ error: 'Internal server error', details: error instanceof Error ? error.stack : error }, { status: 500 });
	}
};
