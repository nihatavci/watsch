import type { RequestHandler } from '@sveltejs/kit';
import { error, json } from '@sveltejs/kit';
import { TMDB_API_KEY } from '$lib/env-loader';
import { env } from '$env/dynamic/private';

// Get environment variables using SvelteKit's env system
const AUTH0_DOMAIN = env.PRIVATE_AUTH0_DOMAIN;
const AUTH0_CLIENT_ID = env.PRIVATE_AUTH0_CLIENT_ID;
const AUTH0_CLIENT_SECRET = env.PRIVATE_AUTH0_CLIENT_SECRET;

// Development mode detection
const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production';

// Security: Minimal logging without exposing sensitive data
console.log('[Auth Debug] Environment variables check:');
console.log('[Auth Debug] AUTH0_DOMAIN:', AUTH0_DOMAIN ? 'Set' : 'Missing');
console.log('[Auth Debug] AUTH0_CLIENT_ID:', AUTH0_CLIENT_ID ? 'Set' : 'Missing');
console.log('[Auth Debug] AUTH0_CLIENT_SECRET:', AUTH0_CLIENT_SECRET ? 'Set' : 'Missing');
console.log('[Auth Debug] Development mode:', isDev);
console.log('[Auth Debug] Mock auth enabled:', (env as any).USE_MOCK_AUTH === 'true' || (env as any).PRIVATE_USE_MOCK_AUTH === 'true');

// Check for environment variables
const hasAuth0Config = AUTH0_DOMAIN && AUTH0_CLIENT_ID && AUTH0_CLIENT_SECRET;
if (!hasAuth0Config) {
	console.error('Missing AUTH0 environment variables');
	if (!isDev) {
		console.error('Auth0 is required in production mode');
	} else {
		console.warn('Auth0 not configured - development mode will use mock authentication');
	}
}

// Security: Do not log API keys, even partially
console.log('[Auth Debug] TMDB API key status:', TMDB_API_KEY ? 'Present' : 'Missing');

// Security: Input validation function
function validateAuthInput(email: string, password: string, action: string): { valid: boolean; error?: string } {
	if (!email || !password) {
		return { valid: false, error: 'Email and password are required' };
	}
	
	// Basic email validation
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
		return { valid: false, error: 'Invalid email format' };
	}
	
	// Password strength validation
	if (password.length < 8) {
		return { valid: false, error: 'Password must be at least 8 characters long' };
	}
	
	// Action validation
	if (!['login', 'register'].includes(action)) {
		return { valid: false, error: 'Invalid action' };
	}
	
	return { valid: true };
}

// POST /api/auth (login or register)
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { email, password, action } = body;

	// Security: Validate input before processing
	const validation = validateAuthInput(email, password, action);
	if (!validation.valid) {
		return json({ error: validation.error }, { status: 400 });
	}

	// Development mode mock authentication - DISABLED when Auth0 is configured
	// Only use mock auth if explicitly enabled via USE_MOCK_AUTH environment variable
	const useMockAuth = (env as any).USE_MOCK_AUTH === 'true' || (env as any).PRIVATE_USE_MOCK_AUTH === 'true';
	
	// In development, allow mock auth when Auth0 is not configured
	if (!hasAuth0Config && isDev) {
		console.log('[Auth Debug] Using mock authentication for development (Auth0 not configured)');
		
		if (action === 'register') {
			return json({ 
				message: 'Mock registration successful!',
				mockMode: true
			});
		}
		
		// Mock login - just return a fake token
		const mockToken = `mock-token-${Date.now()}`;
		return json({
			access_token: mockToken,
			token_type: 'Bearer',
			expires_in: 3600,
			refresh_token: `mock-refresh-${Date.now()}`,
			user: {
				email,
				userId: `mock-user-${Date.now()}`,
				name: 'Mock User',
				picture: null
			},
			mockMode: true
		});
	}

	// Return error if Auth0 not configured in production
	if (!hasAuth0Config) {
		return json({ error: 'Authentication service not configured' }, { status: 503 });
	}

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
				console.error('[Auth0 Error] Registration failed:', {
					status: res.status,
					error: data.error,
					description: data.description,
					// Security: Don't log email in production
					...(isDev && { email })
				});
				
				// Map Auth0 error codes to user-friendly messages
				let errorMessage = 'Registration failed';
				if (data.code === 'invalid_password') {
					errorMessage = 'Password is too weak. Please use a stronger password with at least 8 characters, including uppercase, lowercase, numbers, and special characters.';
				} else if (data.code === 'user_exists') {
					errorMessage = 'An account with this email already exists.';
				} else if (data.description) {
					errorMessage = data.description;
				}
				
				return json(
					{
						error: errorMessage
					},
					{ status: 400 }
				);
			}

			return json({ message: 'Registration successful! Please check your email.' });
		}

		// Default: login - Using Resource Owner Password Grant
		// Security Note: This should be replaced with Authorization Code Flow + PKCE in production
		console.warn('[Security] Using Resource Owner Password Grant - consider upgrading to Authorization Code Flow with PKCE');
		
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
			console.error('[Auth0 Error] Login failed:', {
				status: tokenRes.status,
				error: tokenData.error,
				description: tokenData.error_description,
				// Security: Don't log email in production
				...(isDev && { email })
			});
			
			// Map Auth0 error codes to user-friendly messages
			let errorMessage = 'Invalid email or password';
			if (tokenData.error === 'invalid_grant') {
				errorMessage = 'Wrong email or password.';
			} else if (tokenData.error === 'too_many_attempts') {
				errorMessage = 'Too many failed attempts. Please try again later.';
			} else if (tokenData.error === 'unauthorized') {
				errorMessage = 'Authentication failed. Please check your credentials.';
			} else if (tokenData.error_description) {
				errorMessage = tokenData.error_description;
			}
			
			return json(
				{
					error: errorMessage
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
