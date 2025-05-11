/**
 * Environment variables service
 * This module provides environment variables with fallbacks.
 */

export interface EnvVariables {
	TMDB_API_KEY: string;
	TMDB_ACCESS_TOKEN: string;
	OPENAI_API_KEY: string;
	RAPID_API_KEY: string;
	YOUTUBE_API_KEY: string;
	OMDB_API_KEY: string;
}

// Define our hardcoded fallback values
const FALLBACK_VALUES = {
	TMDB_API_KEY: 'd5eec449ee98dc75336ca05b0f2b8133',
	TMDB_ACCESS_TOKEN:
		'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkNWVlYzQ0OWVlOThkYzc1MzM2Y2EwNWIwZjJiODEzMyIsIm5iZiI6MTczNzgxNTExNS45NTksInN1YiI6IjY3OTRmNDRiYzVhNTQ1Yjk1MTJhZGRjYSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.s5b0q27_wRXFDJS5KJ2uC7zKYhg6jshFqzOHcB_zQDg',
	OPENAI_API_KEY: '',
	RAPID_API_KEY: '',
	YOUTUBE_API_KEY: '',
	OMDB_API_KEY: ''
};

// Function to get environment variables with proper type checking
function getEnvValue(key: string, fallback: string): string {
	// For Vite/SvelteKit, environment variables need to be prefixed with VITE_
	// in .env files to be exposed to the client
	const viteKey = `VITE_${key}`;

	// For server-side code, try to access import.meta.env
	if (typeof import.meta !== 'undefined' && import.meta.env) {
		const env = import.meta.env as Record<string, string>;
		if (env[key]) {
			return env[key];
		}
		if (env[viteKey]) {
			return env[viteKey];
		}
	}

	// For browser/client, try to access window.env
	if (typeof window !== 'undefined' && (window as any).env && (window as any).env[key]) {
		return (window as any).env[key];
	}

	return fallback;
}

/**
 * Get environment variables with fallbacks
 */
export function getEnvVariables(): EnvVariables {
	try {
		// Log loading attempt (for debugging)
		console.log('Loading environment variables...');

		// Get values with fallbacks
		const result = {
			TMDB_API_KEY: getEnvValue('TMDB_API_KEY', FALLBACK_VALUES.TMDB_API_KEY),
			TMDB_ACCESS_TOKEN: getEnvValue('TMDB_ACCESS_TOKEN', FALLBACK_VALUES.TMDB_ACCESS_TOKEN),
			OPENAI_API_KEY: getEnvValue('OPENAI_API_KEY', FALLBACK_VALUES.OPENAI_API_KEY),
			RAPID_API_KEY: getEnvValue('RAPID_API_KEY', FALLBACK_VALUES.RAPID_API_KEY),
			YOUTUBE_API_KEY: getEnvValue('YOUTUBE_API_KEY', FALLBACK_VALUES.YOUTUBE_API_KEY),
			OMDB_API_KEY: getEnvValue('OMDB_API_KEY', FALLBACK_VALUES.OMDB_API_KEY)
		};

		// Log (partially masked) key values for debugging
		if (result.TMDB_API_KEY) {
			console.log('TMDB API Key loaded:', `${result.TMDB_API_KEY.slice(0, 5)}...`);
		} else {
			console.warn('TMDB API Key not found, using fallback');
		}

		return result;
	} catch (error) {
		console.error('Error loading environment variables:', error);
		return FALLBACK_VALUES;
	}
}
