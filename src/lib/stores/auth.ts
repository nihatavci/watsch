import { writable, derived } from 'svelte/store';
import type { Writable } from 'svelte/store';

export interface User {
	email: string;
	userId?: string;
	picture?: string;
	name?: string;
}

export interface AuthState {
	isAuthenticated: boolean;
	token: string | null;
	user: User | null;
	tokenExpiry: number | null;
}

const initialState: AuthState = {
	isAuthenticated: false,
	token: null,
	user: null,
	tokenExpiry: null
};

// Create the writable store
export const authStore: Writable<AuthState> = writable(initialState);

// Derived store for authentication status (for easier checks)
export const isAuthenticated = derived(authStore, ($auth) => $auth.isAuthenticated);

// Initialize auth from localStorage
export const initAuth = () => {
	if (typeof window === 'undefined') return;

	try {
		const storedToken = localStorage.getItem('auth_token');
		const storedUser = localStorage.getItem('auth_user');
		const storedExpiry = localStorage.getItem('auth_expiry');

		if (storedToken) {
			const tokenExpiry = storedExpiry ? Number(storedExpiry) : null;

			// Check if token is expired
			if (tokenExpiry && Date.now() >= tokenExpiry) {
				clearAuth();
				return;
			}

			// If token is valid, restore auth state
			authStore.update((state) => ({
				...state,
				isAuthenticated: true,
				token: storedToken,
				user: storedUser ? JSON.parse(storedUser) : null,
				tokenExpiry
			}));
		}
	} catch (error) {
		console.error('Error initializing auth state:', error);
		clearAuth();
	}
};

// Set authentication data
export const setAuth = (token: string, expiresIn: number, user: User, refreshToken?: string) => {
	if (typeof window === 'undefined') return;

	try {
		// Calculate token expiry timestamp
		const expiryTime = Date.now() + expiresIn * 1000;

		// Store in localStorage
		localStorage.setItem('auth_token', token);
		localStorage.setItem('auth_user', JSON.stringify(user));
		localStorage.setItem('auth_expiry', expiryTime.toString());

		// Store refresh token if provided
		if (refreshToken) {
			localStorage.setItem('auth_refresh_token', refreshToken);
		}

		// Update store
		authStore.update((state) => ({
			...state,
			isAuthenticated: true,
			token,
			user,
			tokenExpiry: expiryTime
		}));

		// Set up auto-refresh if token is short-lived
		if (expiresIn < 3600) {
			// Less than 1 hour
			setTimeout(() => refreshToken(), (expiresIn - 300) * 1000); // Refresh 5 minutes before expiry
		}
	} catch (error) {
		console.error('Error setting auth data:', error);
	}
};

// Clear authentication data
export const clearAuth = () => {
	if (typeof window === 'undefined') return;

	try {
		localStorage.removeItem('auth_token');
		localStorage.removeItem('auth_user');
		localStorage.removeItem('auth_expiry');
		localStorage.removeItem('auth_refresh_token');

		authStore.set(initialState);
	} catch (error) {
		console.error('Error clearing auth data:', error);
	}
};

// Refresh the auth token
export const refreshToken = async () => {
	if (typeof window === 'undefined') return;

	try {
		// Get current token from store
		let currentState: AuthState;
		authStore.subscribe((state) => {
			currentState = state;
		})();

		if (!currentState.token || !localStorage.getItem('auth_token')) {
			return;
		}

		// Get the refresh token from localStorage
		const refreshToken = localStorage.getItem('auth_refresh_token');
		if (!refreshToken) {
			clearAuth();
			return;
		}

		// Call refresh token endpoint
		const response = await fetch('/api/auth/refresh', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ refresh_token: refreshToken })
		});

		if (response.ok) {
			const data = await response.json();
			// Store the refresh token
			localStorage.setItem('auth_refresh_token', data.refresh_token);
			// Update auth state with new access token
			setAuth(
				data.access_token,
				data.expires_in,
				currentState.user || { email: '' },
				data.refresh_token
			);
		} else {
			// If refresh fails, clear auth
			clearAuth();
		}
	} catch (error) {
		console.error('Error refreshing token:', error);
		clearAuth();
	}
};

// Initialize auth on module import
if (typeof window !== 'undefined') {
	initAuth();
}
