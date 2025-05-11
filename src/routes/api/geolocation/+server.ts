import { json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';

export async function GET({ request, getClientAddress }: RequestEvent) {
	try {
		// Get client IP using SvelteKit's built-in getClientAddress
		const ip = getClientAddress();

		// In development, use a public IP to test the service
		const isDev = process.env.NODE_ENV === 'development';
		const queryIp = isDev ? '' : ip; // Empty query will use the requesting IP

		// Use ip-api.com free endpoint with specific fields we need
		const response = await fetch(
			`http://ip-api.com/json/${queryIp}?fields=status,message,country,countryCode`,
			{
				headers: {
					Accept: 'application/json'
				}
			}
		);

		const data = await response.json();

		if (data.status !== 'success') {
			console.warn('IP-API response:', data);
			throw new Error(data.message || 'Failed to get location data');
		}

		// Country to language mapping
		const countryToLang: Record<string, string> = {
			// Turkish-speaking countries
			TR: 'tr', // Turkey
			CY: 'tr', // Cyprus (partial)

			// English-speaking countries
			US: 'en', // United States
			GB: 'en', // United Kingdom
			CA: 'en', // Canada
			AU: 'en', // Australia
			NZ: 'en', // New Zealand
			IE: 'en', // Ireland

			// Spanish-speaking countries
			ES: 'es', // Spain
			MX: 'es', // Mexico
			AR: 'es', // Argentina
			CO: 'es', // Colombia
			PE: 'es', // Peru
			VE: 'es', // Venezuela
			CL: 'es', // Chile

			// French-speaking countries
			FR: 'fr', // France
			BE: 'fr', // Belgium
			LU: 'fr', // Luxembourg

			// German-speaking countries
			DE: 'de', // Germany
			AT: 'de', // Austria
			LI: 'de' // Liechtenstein
		};

		const detectedLang = countryToLang[data.countryCode] || 'en';

		// Check remaining rate limit from headers
		const remainingRequests = response.headers.get('X-Rl');
		const timeToReset = response.headers.get('X-Ttl');

		console.log('Geolocation detection:', {
			ip: queryIp || 'current IP',
			country: data.country,
			countryCode: data.countryCode,
			detectedLang,
			remainingRequests,
			timeToReset,
			fullResponse: data
		});

		return json({
			country: data.country,
			countryCode: data.countryCode,
			language: detectedLang,
			ip: queryIp || 'current IP'
		});
	} catch (error) {
		console.error('Geolocation error:', error);

		// Fallback to browser language if available
		if (typeof navigator !== 'undefined') {
			const browserLang = navigator.language.split('-')[0];
			if (['en', 'es', 'fr', 'de', 'tr'].includes(browserLang)) {
				return json({ language: browserLang });
			}
		}

		return json({ language: 'en' });
	}
}
