import { json } from '@sveltejs/kit';
import { api } from '$lib/api';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    const health = api.getHealth();
    
    return json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    return json(
      { 
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}; 