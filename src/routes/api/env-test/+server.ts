import { json } from '@sveltejs/kit';
import { TMDB_API_KEY as PRIVATE_TMDB_API_KEY } from '$lib/env-loader';

export function GET() {
	return json({
		tmdbKeyAvailable: !!PRIVATE_TMDB_API_KEY,
		tmdbKeyFirstFive: PRIVATE_TMDB_API_KEY ? PRIVATE_TMDB_API_KEY.substring(0, 5) : null
	});
} 