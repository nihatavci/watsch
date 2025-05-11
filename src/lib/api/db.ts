// Database utility functions for feature unlocks
import { browser } from '$app/environment';

// In-memory database for server-side features (will reset on server restart)
// In a production app, you would use a real database
const searchLimits = new Map<string, { count: number, lastReset: number }>();
const watchLater = new Map<string, Set<string>>();

// Constants
export const MAX_SEARCHES_PER_DAY = 2;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Search limit functions
export async function getSearchCount(ip: string): Promise<number> {
  const now = Date.now();
  const record = searchLimits.get(ip);
  
  // If no record or last reset was more than a day ago, reset the count
  if (!record || (now - record.lastReset > ONE_DAY_MS)) {
    searchLimits.set(ip, { count: 0, lastReset: now });
    return 0;
  }
  
  return record.count;
}

export async function incrementSearchCount(ip: string): Promise<number> {
  const currentCount = await getSearchCount(ip);
  const newCount = currentCount + 1;
  
  // Get existing or create new record
  const record = searchLimits.get(ip) || { count: 0, lastReset: Date.now() };
  
  // Update the record
  searchLimits.set(ip, { 
    count: newCount, 
    lastReset: record.lastReset 
  });
  
  return newCount;
}

export async function resetSearchCount(ip: string): Promise<void> {
  searchLimits.set(ip, { count: 0, lastReset: Date.now() });
}

export async function canPerformSearch(ip: string, isAuthenticated: boolean): Promise<boolean> {
  // Authenticated users can always search
  if (isAuthenticated) return true;
  
  // For unauthenticated users, check the limit
  const count = await getSearchCount(ip);
  return count < MAX_SEARCHES_PER_DAY;
}

// Watch Later functions
export async function saveToWatchLater(userId: string, mediaId: string, mediaType: 'movie' | 'tv'): Promise<boolean> {
  // Create user's collection if it doesn't exist
  if (!watchLater.has(userId)) {
    watchLater.set(userId, new Set());
  }
  
  // Add the media item (with type prefix for disambiguation)
  const mediaKey = `${mediaType}:${mediaId}`;
  watchLater.get(userId)?.add(mediaKey);
  
  return true;
}

export async function removeFromWatchLater(userId: string, mediaId: string, mediaType: 'movie' | 'tv'): Promise<boolean> {
  // If user doesn't have a collection, nothing to remove
  if (!watchLater.has(userId)) {
    return false;
  }
  
  // Create the media key and remove it
  const mediaKey = `${mediaType}:${mediaId}`;
  return watchLater.get(userId)?.delete(mediaKey) || false;
}

export async function isInWatchLater(userId: string, mediaId: string, mediaType: 'movie' | 'tv'): Promise<boolean> {
  // If user doesn't have a collection, it's not saved
  if (!watchLater.has(userId)) {
    return false;
  }
  
  // Check if the media key exists in the user's collection
  const mediaKey = `${mediaType}:${mediaId}`;
  return watchLater.get(userId)?.has(mediaKey) || false;
}

export async function getWatchLaterList(userId: string): Promise<string[]> {
  // If user doesn't have a collection, return empty list
  if (!watchLater.has(userId)) {
    return [];
  }
  
  // Convert the Set to an Array and return it
  return Array.from(watchLater.get(userId) || []);
} 