import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	OPENAI_API_KEY,
	TMDB_API_KEY,
	YOUTUBE_API_KEY,
	RAPID_API_KEY,
	OMDB_API_KEY
} from '$lib/env-loader';

export const GET: RequestHandler = async () => {
	try {
		// Only expose the existence of keys and a masked preview of them
		const envInfo = {
			openai: maskApiKey(OPENAI_API_KEY),
			tmdb: maskApiKey(TMDB_API_KEY),
			youtube: maskApiKey(YOUTUBE_API_KEY),
			rapidApi: maskApiKey(RAPID_API_KEY),
			omdb: maskApiKey(OMDB_API_KEY)
		};

		return json({
			message: 'Environment check',
			variables: envInfo
		});
	} catch (error) {
		console.error('Error checking env variables:', error);
		return json({ error: 'Failed to check environment variables' }, { status: 500 });
	}
};

// Helper function to mask API keys
function maskApiKey(key?: string): { exists: boolean; preview?: string; length?: number } {
	if (!key) {
		return { exists: false };
	}

	// Only show first 4 and last 4 characters if key is long enough
	if (key.length > 10) {
		const prefix = key.substring(0, 4);
		const suffix = key.substring(key.length - 4);
		return {
			exists: true,
			preview: `${prefix}...${suffix}`,
			length: key.length
		};
	}

	return {
		exists: true,
		length: key.length
	};
}
