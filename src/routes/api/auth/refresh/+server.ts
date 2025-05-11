import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

// Get environment variables
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET;

// Check for environment variables
if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID || !AUTH0_CLIENT_SECRET) {
	console.error('Missing AUTH0 environment variables');
}

// POST /api/auth/refresh
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { refresh_token } = body;

		if (!refresh_token) {
			return json({ error: 'Refresh token is required' }, { status: 400 });
		}

		const tokenRes = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				grant_type: 'refresh_token',
				client_id: AUTH0_CLIENT_ID,
				client_secret: AUTH0_CLIENT_SECRET,
				refresh_token
			})
		});

		const tokenData = await tokenRes.json();

		if (!tokenRes.ok) {
			return json({ error: 'Token refresh failed' }, { status: 401 });
		}

		return json({
			access_token: tokenData.access_token,
			token_type: tokenData.token_type,
			expires_in: tokenData.expires_in,
			refresh_token: tokenData.refresh_token || refresh_token
		});
	} catch (err) {
		console.error('Token refresh error:', err);
		return json({ error: 'Token refresh failed' }, { status: 500 });
	}
};
