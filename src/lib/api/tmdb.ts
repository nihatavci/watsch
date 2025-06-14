/**
 * Centralized TMDB API client utility
 * This module handles all TMDB API requests with proper authentication
 */
import { browser } from '$app/environment';
import { getEnvVariables } from '$lib/env';
import { dev } from '$app/environment';

// Placeholder API key for development only - NOT an actual API key
// This is a placeholder pattern so no real key is in the repository
const DEV_PLACEHOLDER_TMDB_API_KEY = 'tmdb-placeholder-api-key-for-development';

// Export a constant API key - this is just a reference, will be replaced at runtime
export const TMDB_API_KEY = DEV_PLACEHOLDER_TMDB_API_KEY;

// Check if a key is a placeholder (not a real key)
const isPlaceholderKey = (key: string) => 
  key.includes('placeholder') || key === DEV_PLACEHOLDER_TMDB_API_KEY;

/**
 * Get TMDB API key from environment variables or fallback
 */
export async function getTMDBApiKey(): Promise<string> {
  try {
    let apiKey = '';
    // For server-side code, use environment variables
    if (!browser) {
      // First try to import from $env/static/private
      try {
        const { 
          TMDB_API_KEY, 
          PRIVATE_TMDB_API_KEY 
        } = await import('$env/static/private');
        
        apiKey = TMDB_API_KEY || PRIVATE_TMDB_API_KEY || '';
        
        if (apiKey) {
          console.log('Using TMDB API key from environment:', apiKey.substring(0, 5) + '...');
          return apiKey;
        }
      } catch (error) {
        console.warn('Error importing TMDB_API_KEY from $env/static/private:', error);
      }
      
      // Try using getEnvVariables as backup
      const env = getEnvVariables();
      if (env.TMDB_API_KEY) {
        console.log('Using TMDB API key from getEnvVariables:', env.TMDB_API_KEY.substring(0, 5) + '...');
        return env.TMDB_API_KEY;
      }
    }
    
    // In development mode, prompt the user to set an API key
    if (dev) {
      if (!apiKey) {
        console.warn(`
===================================================
⚠️ DEVELOPMENT MODE: No TMDB API Key found in .env
===================================================
For local development, please add your API key to .env:

TMDB_API_KEY=your_api_key_here

In a real deployment, you would set this in your 
hosting environment (Vercel, Netlify, etc.)
===================================================
`);
      }
      
      // For development purposes, if all else fails, return the placeholder
      // This allows the app to function in development without real API keys
      if (!apiKey) {
        console.warn('Using placeholder TMDB API key for development');
        return DEV_PLACEHOLDER_TMDB_API_KEY;
      }
      
      return apiKey;
    }
    
    // In production, we require a real API key
    if (!apiKey) {
      console.error('TMDB API key not found in environment variables (PRODUCTION MODE)');
      throw new Error('TMDB API key not found in environment variables');
    }
    
    return apiKey;
  } catch (error) {
    console.error('Error getting TMDB API key:', error);
    
    // In development, fall back to the placeholder as a last resort
    if (dev) {
      console.warn('Falling back to placeholder TMDB API key due to error');
      return DEV_PLACEHOLDER_TMDB_API_KEY;
    }
    
    // In production, re-throw the error
    throw new Error('Failed to get TMDB API key');
  }
}

/**
 * Make a request to the TMDB API
 */
export async function tmdbRequest<T>(
  endpoint: string,
  params: Record<string, string> = {},
  options: RequestInit = {}
): Promise<T> {
  // Get the API key
  const apiKey = await getTMDBApiKey();
  
  // Check if we're using a placeholder key
  if (isPlaceholderKey(apiKey)) {
    if (dev) {
      console.warn('Using placeholder TMDB API key - returning mock data for development');
      
      // Return mock data for development
      return {
        results: [
          {
            id: 123456,
            title: 'Example Movie',
            name: 'Example TV Show',
            poster_path: '/placeholder.jpg',
            backdrop_path: '/placeholder_backdrop.jpg',
            release_date: '2024-01-01',
            first_air_date: '2024-01-01',
            overview: 'This is a placeholder response for development.',
            vote_average: 8.5,
            media_type: 'movie'
          }
        ]
      } as unknown as T;
    } else {
      // In production, placeholder keys are not allowed
      throw new Error('Cannot use placeholder TMDB API key in production');
    }
  }
  
  const url = new URL(`https://api.themoviedb.org/3${endpoint}`);
  
  // Add API key and other params to URL
  url.searchParams.append('api_key', apiKey);
  
  // Add additional parameters
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  
  // Set default headers
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers
  };
  
  const response = await fetch(url.toString(), {
    ...options,
    headers
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('TMDB API Error:', {
      status: response.status,
      statusText: response.statusText,
      data: errorData
    });
    throw new Error(errorData.status_message || `TMDB API error: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Search for movies or TV shows
 */
export async function searchTMDB(
  query: string, 
  type: 'movie' | 'tv' = 'movie',
  language: string = 'en-US'
) {
  try {
    const endpoint = `/search/${type}`;
    const params = {
      query,
      language,
      page: '1',
      include_adult: 'false'
    };
    
    console.log(`Searching TMDB for ${type}: "${query}"`);
    return await tmdbRequest(endpoint, params);
  } catch (error) {
    console.error('Error searching TMDB:', error);
    throw error;
  }
}

/**
 * Get details for a movie or TV show
 */
export async function getDetails(
  id: string, 
  type: 'movie' | 'tv',
  language: string = 'en-US',
  appendToResponse: string = ''
) {
  try {
    const endpoint = `/${type}/${id}`;
    const params: Record<string, string> = { language };
    
    if (appendToResponse) {
      params.append_to_response = appendToResponse;
    }
    
    console.log(`Getting TMDB details for ${type} ID: ${id}`);
    return await tmdbRequest(endpoint, params);
  } catch (error) {
    console.error(`Error getting TMDB details for ${type} ID ${id}:`, error);
    throw error;
  }
}

/**
 * Get streaming providers for a movie or TV show
 */
export async function getStreamingProviders(
  id: string,
  type: 'movie' | 'tv',
  language: string = 'en-US'
) {
  try {
    const endpoint = `/${type}/${id}/watch/providers`;
    const params = { language };
    
    console.log(`Getting streaming providers for ${type} ID: ${id}`);
    return await tmdbRequest(endpoint, params);
  } catch (error) {
    console.error(`Error getting streaming providers for ${type} ID ${id}:`, error);
    throw error;
  }
} 