import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
// Use the direct import for TMDB_API_KEY for clarity and reliability
import { TMDB_API_KEY as PRIVATE_TMDB_API_KEY, OPENAI_API_KEY, YOUTUBE_API_KEY, RAPID_API_KEY, OMDB_API_KEY } from '$lib/env-loader';

type GenreMap = {
[key: string]: number;
};

// Define the type for enhanced query parameters
interface EnhancedQueryParams {
'primary_release_date.gte'?: string;
'primary_release_date.lte'?: string;
sort_by?: string;
'vote_average.gte'?: string;
include_adult?: string;
[key: string]: string | undefined;
}

// Define person/actor search result interface
interface PersonSearchResult {
id: number;
name: string;
popularity: number;
profile_path: string | null;
}

// Genre maps to convert user-friendly names to TMDB IDs
const GENRE_MAP: GenreMap = {
Action: 28,
Adventure: 12,
Animation: 16,
Comedy: 35,
Crime: 80,
Documentary: 99,
Drama: 18,
Family: 10751,
Fantasy: 14,
Horror: 27,
Mystery: 9648,
Romance: 10749,
'Sci-Fi': 878,
Thriller: 53
};

const TV_GENRE_MAP: GenreMap = {
Action: 10759,
Adventure: 10759,
Animation: 16,
Comedy: 35,
Crime: 80,
Documentary: 99,
Drama: 18,
Family: 10751,
Fantasy: 10765,
Horror: 9648,
Mystery: 9648,
Romance: 10749,
'Sci-Fi': 10765,
Thriller: 80
};

// Helper function to verify token and extract user info
function getUserIdFromToken(authHeader: string | null): string | null {
if (!authHeader || !authHeader.startsWith('Bearer ')) {
return null;
}
try {
const token = authHeader.split(' ')[1];
const payloadBase64 = token.split('.')[1];
const payload = JSON.parse(atob(payloadBase64));
return payload.sub || null;
} catch (error) {
console.error('Error extracting user ID from token:', error);
return null;
}
}

export const POST = async ({ request, fetch, getClientAddress }: RequestEvent) => {
try {
const ip = getClientAddress();
const authHeader = request.headers.get('authorization');
const userId = getUserIdFromToken(authHeader);
const isAuthenticated = !!userId;

console.log(`[API Route] Request from ${isAuthenticated ? 'authenticated user' : 'unauthenticated user'}`);
console.log(`[API Route] TMDB_API_KEY loaded: ${PRIVATE_TMDB_API_KEY ? PRIVATE_TMDB_API_KEY.substring(0,6) + '...' : 'NOT LOADED'}`);

// Simple rate limiting for unauthenticated users
// TODO: Implement proper rate limiting with the new API system

const { searched, preferences } = await request.json();
console.log('[API Route] Received search request:', searched);
console.log('[API Route] User preferences:', preferences);

if (!searched) {
console.error('[API Route] No search criteria provided');
return json({ error: 'No search criteria provided' }, { status: 400 });
}

const [mediaType, ...rest] = searched.split(',').map((s: string) => s.trim());
if (!mediaType || !['movie', 'tv'].includes(mediaType)) {
console.error('[API Route] Invalid media type:', mediaType);
return json({ error: 'Invalid media type. Must be "movie" or "tv".' }, { status: 400 });
}

const genres = rest.filter((item: string) => !item.startsWith(' on '));
const platforms =
rest
.find((item: string) => item.startsWith(' on '))
?.replace(' on ', '')
.split(',')
.map((p: string) => p.trim()) || [];

console.log('[API Route] Parsed request:', { mediaType, genres, platforms, preferences });

// Check TMDB API key availability (but don't throw error)
if (!PRIVATE_TMDB_API_KEY) {
console.warn('[API Route] TMDB API key not found - using mock data for development');
return json({ 
  error: 'API service unavailable in development mode', 
  message: 'Please configure TMDB_API_KEY environment variable for full functionality',
  mockMode: true 
}, { status: 503 });
}

// TODO: Implement recommendation logic with the new API system
return json({
  message: 'Recommendation endpoint needs to be updated to use the new API system',
  mockMode: true
}, { status: 503 });

} catch (error) {
console.error('[API Route] Error in getRecommendation handler:', error);
return json(
{
error: error instanceof Error ? error.message : 'Failed to get recommendations',
details: error instanceof Error ? error.stack : undefined
},
{ status: 500 }
);
}
};

// Export a clean interface for environment variables
export const env = {
  TMDB_API_KEY: PRIVATE_TMDB_API_KEY,
  OPENAI_API_KEY,
  YOUTUBE_API_KEY,
  RAPID_API_KEY,
  OMDB_API_KEY,
} as const;

// Compatibility helper for legacy code
export function getEnvVariables() {
  return env;
}

// Type-safe getter for environment variables with graceful fallback
export function getEnvVar(key: keyof typeof env): string | undefined {
  return env[key];
}

// Safe getter that doesn't throw errors
export function getEnvVarSafe(key: keyof typeof env): string | null {
  const value = env[key];
  if (!value) {
    console.warn(`Environment variable ${key} is not configured - using fallback behavior`);
    return null;
  }
  return value;
}

// Log environment status without throwing errors
if (!PRIVATE_TMDB_API_KEY) {
  console.warn('TMDB API key is not configured - application will use mock data in development');
} else {
  console.log('TMDB API key configured successfully');
}