import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Security: This endpoint has been disabled to prevent API key information leakage
export const GET: RequestHandler = async () => {
	return json({ 
		error: 'This endpoint has been disabled for security reasons',
		status: 'Environment information is not publicly accessible'
	}, { status: 403 });
}; 