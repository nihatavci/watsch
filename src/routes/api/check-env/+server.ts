import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	OPENAI_API_KEY,
	TMDB_API_KEY,
	YOUTUBE_API_KEY,
	RAPID_API_KEY,
	OMDB_API_KEY
} from '$env/static/private';
import { TMDB_API_KEY as PRIVATE_TMDB_API_KEY } from '$lib/env-loader';

// Security: Only return boolean status, no partial key exposure
function hasApiKey(key: string | undefined): boolean {
	return !!(key && key.length > 10 && !key.includes('placeholder'));
}

export const GET: RequestHandler = async () => {
	return json({
		status: 'Environment check complete',
		services: {
			openai: hasApiKey(OPENAI_API_KEY),
			tmdb: hasApiKey(PRIVATE_TMDB_API_KEY),
			youtube: hasApiKey(YOUTUBE_API_KEY),
			rapidApi: hasApiKey(RAPID_API_KEY),
			omdb: hasApiKey(OMDB_API_KEY)
		},
		timestamp: new Date().toISOString()
	});
};
