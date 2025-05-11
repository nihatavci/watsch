import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { saveToWatchLater, removeFromWatchLater, getWatchLaterList, isInWatchLater } from '$lib/api/db';

// Helper to extract user ID from auth header
function getUserIdFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    // Extract user ID from token (in a real app, validate the token properly)
    // This is a simplified implementation assuming the token contains user info
    const token = authHeader.split(' ')[1];
    const payloadBase64 = token.split('.')[1];
    const payload = JSON.parse(atob(payloadBase64));
    return payload.sub || null; // Auth0 stores user ID in 'sub' claim
  } catch (error) {
    console.error('Error extracting user ID from token:', error);
    return null;
  }
}

// GET /api/watch-later - Get all saved items
export const GET: RequestHandler = async ({ request }) => {
  try {
    const userId = getUserIdFromRequest(request);
    
    if (!userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const items = await getWatchLaterList(userId);
    return json({ items });
  } catch (error) {
    console.error('Error fetching watch later list:', error);
    return json({ error: 'Failed to fetch watch later list' }, { status: 500 });
  }
};

// POST /api/watch-later - Save an item
export const POST: RequestHandler = async ({ request }) => {
  try {
    const userId = getUserIdFromRequest(request);
    
    if (!userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { mediaId, mediaType } = body;
    
    if (!mediaId || !mediaType || !['movie', 'tv'].includes(mediaType)) {
      return json({ error: 'Invalid media information' }, { status: 400 });
    }
    
    const result = await saveToWatchLater(userId, mediaId, mediaType);
    return json({ success: result });
  } catch (error) {
    console.error('Error saving to watch later:', error);
    return json({ error: 'Failed to save item' }, { status: 500 });
  }
};

// DELETE /api/watch-later - Remove an item
export const DELETE: RequestHandler = async ({ request, url }) => {
  try {
    const userId = getUserIdFromRequest(request);
    
    if (!userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const mediaId = url.searchParams.get('mediaId');
    const mediaType = url.searchParams.get('mediaType');
    
    if (!mediaId || !mediaType || !['movie', 'tv'].includes(mediaType)) {
      return json({ error: 'Invalid media information' }, { status: 400 });
    }
    
    const result = await removeFromWatchLater(userId, mediaId, mediaType);
    return json({ success: result });
  } catch (error) {
    console.error('Error removing from watch later:', error);
    return json({ error: 'Failed to remove item' }, { status: 500 });
  }
}; 