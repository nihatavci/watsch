import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getEnvVariables } from '$lib/env';

async function testTMDB() {
	const env = await getEnvVariables();

	// Test TMDB API with a simple search
	const response = await fetch(
		`https://api.themoviedb.org/3/movie/popular?api_key=${env.TMDB_API_KEY}&language=en-US&page=1`
	);

	const data = await response.json();

	if (!response.ok) {
		console.error('TMDB API Error:', data);
		return json({ error: data.status_message }, { status: response.status });
	}

	return json({
		success: true,
		message: 'TMDB API is working',
		results: data.results?.slice(0, 2) // Return first 2 movies as proof
	});
}

export const GET: RequestHandler = async () => {
	try {
		return await testTMDB();
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

export const POST: RequestHandler = async () => {
	try {
		return await testTMDB();
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
