import { browser } from '$app/environment';
import { dev } from '$app/environment';

// Use process.env for all environment variables to ensure compatibility with Vercel
const TMDB_API_KEY = typeof process !== 'undefined' ? process.env.TMDB_API_KEY || process.env.PRIVATE_TMDB_API_KEY : undefined;
const PRIVATE_OPENAI_API_KEY = typeof process !== 'undefined' ? process.env.PRIVATE_OPENAI_API_KEY : undefined;
const YOUTUBE_API_KEY = typeof process !== 'undefined' ? process.env.YOUTUBE_API_KEY : undefined;
const RAPID_API_KEY = typeof process !== 'undefined' ? process.env.RAPID_API_KEY : undefined;
const OMDB_API_KEY = typeof process !== 'undefined' ? process.env.OMDB_API_KEY : undefined;
// ... keep your DEV_PLACEHOLDER_PATTERNS and dynamic loading for other keys ...

// IMPORTANT: These are NOT real API keys but placeholder patterns
// In development mode, actual keys should be in .env file
// In production, keys MUST be set in the deployment environment
const DEV_PLACEHOLDER_PATTERNS = {
	OPENAI_API_KEY: 'sk-placeholder-development-key-openai-not-real',
	YOUTUBE_API_KEY: 'yt-placeholder-development-key-youtube-not-real',
	RAPID_API_KEY: 'rp-placeholder-development-key-rapidapi-not-real',
	OMDB_API_KEY: 'omdb-placeholder-development-key-omdb-not-real'
};

// Export the real key
export const OPENAI_API_KEY = PRIVATE_OPENAI_API_KEY;
// Export a function for callOpenAI to use
export function getOpenAIApiKey() {
  return OPENAI_API_KEY;
}

// Helper function to check if a key is a placeholder
export function isPlaceholderKey(key: string | undefined): boolean {
  if (!key) return true;
  return Object.values(DEV_PLACEHOLDER_PATTERNS).some(pattern => key.includes(pattern.split('-')[0]));
}
// Export all API keys for server-side use
export { TMDB_API_KEY, YOUTUBE_API_KEY, RAPID_API_KEY, OMDB_API_KEY };

console.log('[DEBUG] TMDB_API_KEY:', TMDB_API_KEY ? TMDB_API_KEY.substring(0, 6) + '...' : TMDB_API_KEY);