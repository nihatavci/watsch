import { json } from '@sveltejs/kit';
import { kv } from '$lib/store/kv';

export async function GET({ url }) {
	try {
		const code = url.searchParams.get('code');

		if (!code) {
			return json({ error: { message: 'Room code is required' } }, { status: 400 });
		}

		const room = await kv.get(`room:${code.toLowerCase()}`);

		if (!room) {
			return json({ error: { message: 'Room not found' } }, { status: 404 });
		}

		return json(room);
	} catch (error) {
		console.error('Error getting room status:', error);
		return json({ error: { message: 'Failed to get room status' } }, { status: 500 });
	}
}
