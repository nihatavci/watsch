import { json } from '@sveltejs/kit';
import { PRIVATE_TMDB_API_KEY } from '$env/static/private';

export function GET() {
	return json({
		tmdbKeyAvailable: !!PRIVATE_TMDB_API_KEY,
		tmdbKeyFirstFive: PRIVATE_TMDB_API_KEY ? PRIVATE_TMDB_API_KEY.substring(0, 5) : null
	});
} 