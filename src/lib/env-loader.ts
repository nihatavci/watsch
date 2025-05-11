import { browser } from '$app/environment';

// Load environment variables
console.log('Loading environment variables...');

// Get environment variables from .env using dotenv directly if not already loaded
// for a more robust environment variable loading mechanism

// If keys are not available in $env/dynamic/private, try to fallback to process.env
// This is a workaround for environments where the SvelteKit env loading doesn't work correctly
const processEnv = typeof process !== 'undefined' ? process.env : {};

// Helper to get environment variables safely for both client and server
function getEnv(key: string): string {
	if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
		return import.meta.env[key] as string;
	}
	return '';
}

// These are the critical API keys needed by the application
export const OPENAI_API_KEY = getEnv('VITE_OPENAI_API_KEY');
export const TMDB_API_KEY = getEnv('VITE_TMDB_API_KEY');
export const YOUTUBE_API_KEY = getEnv('VITE_YOUTUBE_API_KEY');
export const RAPID_API_KEY = getEnv('VITE_RAPID_API_KEY');
export const OMDB_API_KEY = getEnv('VITE_OMDB_API_KEY');

// Log keys loaded (without revealing them)
if (!browser) {
	if (OPENAI_API_KEY) console.log(`OpenAI API Key loaded: ${OPENAI_API_KEY.substring(0, 6)}...`);
	if (TMDB_API_KEY) console.log(`TMDB API Key loaded: ${TMDB_API_KEY.substring(0, 5)}...`);
	if (YOUTUBE_API_KEY) console.log(`YouTube API Key loaded: ${YOUTUBE_API_KEY.substring(0, 5)}...`);
	if (RAPID_API_KEY) console.log(`Rapid API Key loaded: ${RAPID_API_KEY.substring(0, 5)}...`);
	if (OMDB_API_KEY) console.log(`OMDB API Key loaded: ${OMDB_API_KEY.substring(0, 5)}...`);

	// Check for missing keys
	if (!OPENAI_API_KEY)
		console.error('WARNING: OPENAI_API_KEY is not defined in environment variables!');
	if (!TMDB_API_KEY)
		console.error('WARNING: TMDB_API_KEY is not defined in environment variables!');
	if (!YOUTUBE_API_KEY)
		console.error('WARNING: YOUTUBE_API_KEY is not defined in environment variables!');
	if (!RAPID_API_KEY)
		console.error('WARNING: RAPID_API_KEY is not defined in environment variables!');
	if (!OMDB_API_KEY)
		console.error('WARNING: OMDB_API_KEY is not defined in environment variables!');
}

// Function to check if required environment variables are set
export function checkRequiredEnv(key: string): boolean {
	switch (key) {
		case 'OPENAI_API_KEY':
			return !!OPENAI_API_KEY;
		case 'TMDB_API_KEY':
			return !!TMDB_API_KEY;
		case 'YOUTUBE_API_KEY':
			return !!YOUTUBE_API_KEY;
		case 'RAPID_API_KEY':
			return !!RAPID_API_KEY;
		case 'OMDB_API_KEY':
			return !!OMDB_API_KEY;
		default:
			return false;
	}
}
