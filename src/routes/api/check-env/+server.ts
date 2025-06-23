import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Security: Only return boolean status, no partial key exposure
function hasApiKey(key: string | undefined): boolean {
	return !!(key && key.length > 10 && !key.includes('placeholder'));
}

export const GET: RequestHandler = async () => {
	// Safe environment variable access
	const tmdbKey = process.env.TMDB_API_KEY || process.env.PRIVATE_TMDB_API_KEY;
	const openaiKey = process.env.OPENAI_API_KEY || process.env.PRIVATE_OPENAI_API_KEY;
	
	return json({
		status: 'Environment check complete',
		services: {
			openai: hasApiKey(openaiKey),
			tmdb: hasApiKey(tmdbKey),
			// Security: Don't expose other service statuses
			youtube: false,
			rapidApi: false,
			omdb: false
		},
		timestamp: new Date().toISOString()
	});
};
