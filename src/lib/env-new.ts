import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { TMDB_API_KEY as PRIVATE_TMDB_API_KEY } from '$lib/env-loader';
import { callOpenAI } from '$lib/api/openai';
import { canPerformSearch, incrementSearchCount } from '$lib/api/db';

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
    
    const canSearch = await canPerformSearch(ip, isAuthenticated);
    if (!canSearch) {
      if (isAuthenticated) {
        console.warn(`[API Route] Authenticated user ${userId} hit search limit - this should not happen`);
      } else {
        console.log(`[API Route] Search limit reached for IP: ${ip}`);
      }
      
      return json(
        {
          error: 'Search limit reached',
          limit: true,
          message: 'You have reached your daily search limit. Sign in to get unlimited searches!'
        },
        { status: 429 }
      );
    }

    if (!isAuthenticated) {
      await incrementSearchCount(ip);
    }

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

    // Validate TMDB API key
    if (!PRIVATE_TMDB_API_KEY) {
      console.error('[API Route] TMDB API key not found or is empty AFTER import!');
      return json({ error: 'TMDB API key not configured' }, { status: 500 });
    }

    // ... rest of your logic using TMDB_API_KEY ...
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

export function getEnvVariables() {
  return {
    TMDB_API_KEY: PRIVATE_TMDB_API_KEY
  };
} 