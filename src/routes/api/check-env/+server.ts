import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	OPENAI_API_KEY,
	TMDB_API_KEY,
	YOUTUBE_API_KEY,
	RAPID_API_KEY,
	OMDB_API_KEY
} from '$lib/env-loader';
import { PRIVATE_TMDB_API_KEY } from '$env/static/private';

function maskApiKey(key: string | undefined) {
	if (!key) return 'NOT SET';
	return key.substring(0, 4) + '...' + key.substring(key.length - 4);
}

export const GET: RequestHandler = async () => {
	try {
		const envInfo = {
			openai: maskApiKey(OPENAI_API_KEY),
			tmdb: maskApiKey(PRIVATE_TMDB_API_KEY),
			youtube: maskApiKey(YOUTUBE_API_KEY),
			rapidApi: maskApiKey(RAPID_API_KEY),
			omdb: maskApiKey(OMDB_API_KEY)
		};
		return json({ message: 'Environment check', variables: envInfo });
	} catch (error) {
		console.error('Error checking env variables:', error);
		return json({ error: 'Failed to check environment variables' }, { status: 500 });
	}
};
