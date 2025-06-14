import { browser } from '$app/environment';
import { dev } from '$app/environment';
import { TMDB_API_KEY } from '$env/static/private';
import { OPENAI_API_KEY as PRIVATE_OPENAI_API_KEY } from '$env/static/private';
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
// Only export TMDB_API_KEY for server-side use (static import, always works)
export { TMDB_API_KEY };

console.log('[DEBUG] TMDB_API_KEY:', TMDB_API_KEY ? TMDB_API_KEY.substring(0, 6) + '...' : TMDB_API_KEY);