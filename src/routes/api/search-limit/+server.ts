import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSearchCount, incrementSearchCount, MAX_SEARCHES_PER_DAY, canPerformSearch } from '$lib/api/db';
import { authStore } from '$lib/stores/auth'; // Import auth store to check authentication status

// GET /api/search-limit - Get current search limit status
export const GET: RequestHandler = async ({ request, getClientAddress }) => {
  try {
    // Get the client IP address
    const ip = getClientAddress();
    
    // Check authentication status from request headers
    const authHeader = request.headers.get('authorization');
    const isAuthenticated = !!authHeader && authHeader.startsWith('Bearer ');
    
    // Get current search count
    const count = await getSearchCount(ip);
    
    // Determine if search is allowed
    const canSearch = await canPerformSearch(ip, isAuthenticated);
    
    return json({
      searchesUsed: count,
      searchesRemaining: isAuthenticated ? null : Math.max(0, MAX_SEARCHES_PER_DAY - count),
      isLimited: !isAuthenticated,
      canSearch: canSearch
    });
  } catch (error) {
    console.error('Error checking search limit:', error);
    return json({ error: 'Failed to check search limit' }, { status: 500 });
  }
};

// POST /api/search-limit/increment - Increment search count
export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  try {
    // Get the client IP address
    const ip = getClientAddress();
    
    // Check authentication status from request headers
    const authHeader = request.headers.get('authorization');
    const isAuthenticated = !!authHeader && authHeader.startsWith('Bearer ');
    
    // If authenticated, don't increment the counter
    if (isAuthenticated) {
      return json({
        searchesUsed: 0,
        searchesRemaining: null,
        isLimited: false,
        canSearch: true
      });
    }
    
    // Increment the counter for unauthenticated users
    const newCount = await incrementSearchCount(ip);
    
    return json({
      searchesUsed: newCount,
      searchesRemaining: Math.max(0, MAX_SEARCHES_PER_DAY - newCount),
      isLimited: true,
      canSearch: newCount < MAX_SEARCHES_PER_DAY
    });
  } catch (error) {
    console.error('Error incrementing search count:', error);
    return json({ error: 'Failed to update search count' }, { status: 500 });
  }
}; 