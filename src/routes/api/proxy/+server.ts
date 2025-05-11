import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const imageUrl = url.searchParams.get('url');

	if (!imageUrl) {
		throw error(400, 'Missing image URL');
	}

	try {
		const response = await fetch(imageUrl);
		const blob = await response.blob();

		return new Response(blob, {
			headers: {
				'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
				'Access-Control-Allow-Origin': '*'
			}
		});
	} catch (err) {
		throw error(500, 'Failed to fetch image');
	}
};
