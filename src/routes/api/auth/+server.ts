import type { RequestHandler } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import { TMDB_API_KEY } from '$lib/env-loader';

// Get environment variables - this works in SvelteKit server routes
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET;

// Check for environment variables
if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID || !AUTH0_CLIENT_SECRET) {
	console.error('Missing AUTH0 environment variables');
}

console.log('TMDB_API_KEY:', TMDB_API_KEY ? 'Present (first 5 chars: ' + TMDB_API_KEY.substring(0, 5) + '...)' : 'NOT FOUND');

// POST /api/auth (login or register)
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { email, password, action } = body;

	try {
		if (action === 'register') {
			// Registration (signup) via Auth0
			const res = await fetch(`https://${AUTH0_DOMAIN}/dbconnections/signup`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					client_id: AUTH0_CLIENT_ID,
					email,
					password,
					connection: 'Username-Password-Authentication'
				})
			});

			const data = await res.json();

			if (!res.ok) {
				return json(
					{
						error: data.error || data.description || 'Registration failed'
					},
					{ status: 400 }
				);
			}

			return json({ message: 'Registration successful! Please check your email.' });
		}

		// Default: login - Using Resource Owner Password Grant
		// Note: This is not ideal for production, but used for simplicity in this example
		const tokenRes = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				grant_type: 'password',
				client_id: AUTH0_CLIENT_ID,
				client_secret: AUTH0_CLIENT_SECRET,
				username: email,
				password,
				audience: `https://${AUTH0_DOMAIN}/api/v2/`,
				scope: 'openid profile email offline_access'
			})
		});

		const tokenData = await tokenRes.json();

		if (!tokenRes.ok) {
			console.error('Auth0 error:', tokenData);
			return json(
				{
					error: tokenData.error_description || 'Invalid email or password'
				},
				{ status: 401 }
			);
		}

		// Get user profile information
		const userInfoRes = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
			headers: {
				Authorization: `Bearer ${tokenData.access_token}`
			}
		});

		if (!userInfoRes.ok) {
			return json({
				access_token: tokenData.access_token,
				token_type: tokenData.token_type,
				expires_in: tokenData.expires_in,
				refresh_token: tokenData.refresh_token,
				user: { email }
			});
		}

		const userInfo = await userInfoRes.json();

		return json({
			access_token: tokenData.access_token,
			token_type: tokenData.token_type,
			expires_in: tokenData.expires_in,
			refresh_token: tokenData.refresh_token,
			user: {
				email: userInfo.email,
				userId: userInfo.sub,
				name: userInfo.name,
				picture: userInfo.picture
			}
		});
	} catch (err) {
		console.error('Auth error:', err);
		return json({ error: 'Authentication failed' }, { status: 500 });
	}
};

// DELETE /api/auth (logout)
export const DELETE: RequestHandler = async ({ request }) => {
	try {
		const authHeader = request.headers.get('authorization');

		if (!authHeader) {
			return json({ message: 'Logged out' });
		}

		const token = authHeader.split(' ')[1];

		// Optional: revoke token on Auth0 side
		const res = await fetch(`https://${AUTH0_DOMAIN}/oauth/revoke`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				client_id: AUTH0_CLIENT_ID,
				client_secret: AUTH0_CLIENT_SECRET,
				token
			})
		});

		return json({ message: 'Logged out' });
	} catch (err) {
		console.error('Logout error:', err);
		return json({ message: 'Logged out' });
	}
};

// PATCH /api/auth (password reset)
export const PATCH: RequestHandler = async ({ request }) => {
	const { email } = await request.json();
	try {
		// Proxy password reset request to Auth0
		const res = await fetch(`https://${AUTH0_DOMAIN}/dbconnections/change_password`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				client_id: AUTH0_CLIENT_ID,
				email,
				connection: 'Username-Password-Authentication'
			})
		});

		if (!res.ok) {
			const data = await res.json();
			return json(
				{ error: data.error || data.description || 'Password reset failed' },
				{ status: 400 }
			);
		}

		return json({ message: 'Password reset email sent' });
	} catch (err) {
		console.error('Password reset error:', err);
		return json({ error: 'Password reset failed' }, { status: 500 });
	}
};

export function GET() {
	return json({
		authenticated: true
	});
}
