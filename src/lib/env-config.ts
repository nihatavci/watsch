import { TMDB_API_KEY as PRIVATE_TMDB_API_KEY } from '$lib/env-loader';

// Validate environment variables at startup
if (!PRIVATE_TMDB_API_KEY) {
  console.error('TMDB API key is not configured in environment variables');
  throw new Error('TMDB API key is required');
}

// Export a clean interface for environment variables
export const env = {
  TMDB_API_KEY: PRIVATE_TMDB_API_KEY,
} as const;

// Type-safe getter for environment variables
export function getEnvVar(key: keyof typeof env): string {
  const value = env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not configured`);
  }
  return value;
} 