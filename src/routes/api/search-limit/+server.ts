import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

// TODO: Implement proper rate limiting with the new API system
// For now, we'll return a simple response to get the build working

export const GET = async ({ getClientAddress }: RequestEvent) => {
  try {
    const ip = getClientAddress();
    
    console.log(`[API Route] Search limit check for IP: ${ip}`);
    
    // TODO: Implement proper rate limiting logic
    // For now, return unlimited searches to get the build working
    return json({
      searchCount: 0,
      maxSearches: 999,
      canSearch: true,
      message: 'Rate limiting system is being updated',
      mockMode: true
    });

  } catch (error) {
    console.error('[API Route] Error in search-limit handler:', error);
    return json(
      {
        error: error instanceof Error ? error.message : 'Failed to check search limit',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}; 