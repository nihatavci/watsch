import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getEnvVariables } from '$lib/env';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { title } = await request.json();
		
		if (!title) {
			return json({ error: 'Title is required' }, { status: 400 });
		}

		const env = await getEnvVariables();
		const OMDB_API_KEY = env.OMDB_API_KEY;
		
		if (!OMDB_API_KEY) {
			console.error('OMDB API key is not configured');
			console.log('Available environment variables:', Object.keys(env));
			return json({ 
				error: 'API configuration error',
				details: 'OMDB_API_KEY is missing from environment variables'
			}, { status: 500 });
		}

		// Add retry logic
		const maxRetries = 3;
		let lastError;

		for (let i = 0; i < maxRetries; i++) {
			try {
				const response = await fetch(
					`https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${OMDB_API_KEY}`
				);

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const data = await response.json();
				
				// Check for API-specific errors
				if (data.Error === 'Invalid API key!') {
					console.error('OMDB API key validation failed');
					return json({ error: 'API authentication failed' }, { status: 401 });
				}

				if (data.Error) {
					return json({ error: data.Error }, { status: 404 });
				}

				return json(data);
			} catch (error) {
				lastError = error;
				// Wait before retrying
				await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
			}
		}

		console.error('Failed after retries:', lastError);
		return json({ error: 'Service temporarily unavailable' }, { status: 503 });

	} catch (error) {
		console.error('API Error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
