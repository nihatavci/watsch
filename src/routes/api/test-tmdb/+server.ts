import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TMDB_API_KEY as PRIVATE_TMDB_API_KEY } from '$lib/env-loader';

export const GET: RequestHandler = async () => {
	try {
		const apiKey = PRIVATE_TMDB_API_KEY;
		console.log('TMDB_API_KEY (first 5 chars):', apiKey.substring(0, 5) + '...');

		// Test the TMDB API with a simple request
		const response = await fetch(
			`https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=en-US&page=1`
		);

		if (!response.ok) {
			throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		return json({
			success: true,
			message: 'TMDB API is working',
			results: data.results.slice(0, 3) // Return first 3 movies as a test
		});
	} catch (error) {
		console.error('Error testing TMDB API:', error);
		return json({
			success: false,
			message: error instanceof Error ? error.message : 'Failed to test TMDB API'
		}, {
			status: 500
		});
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

export function getTMDBKey() {
	const apiKey = PRIVATE_TMDB_API_KEY;
	console.log('TMDB_API_KEY (first 5 chars):', apiKey.substring(0, 5) + '...');

	return json({
		success: true,
		message: 'TMDB API key is configured'
	});
}
