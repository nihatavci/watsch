import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return json({
		success: true,
		message: 'Simple test endpoint working',
		timestamp: new Date().toISOString()
	});
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		return json({
			success: true,
			message: 'POST test working',
			received: body,
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		return json({
			success: false,
			error: 'Failed to parse body',
			timestamp: new Date().toISOString()
		});
	}
}; 