import { json } from '@sveltejs/kit';

export async function GET({ request }) {
    try {
        // Get client IP from request headers
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                  request.headers.get('x-real-ip') ||
                  '8.8.8.8'; // Fallback IP for development

        // Call IP geolocation API (using ipapi.co - it's free)
        const response = await fetch(`https://ipapi.co/${ip}/json/`);
        const data = await response.json();

        // Map country code to supported language
        const countryToLang: Record<string, string> = {
            'TR': 'tr',
            'US': 'en',
            'GB': 'en',
            'ES': 'es',
            'MX': 'es',
            'FR': 'fr',
            'DE': 'de',
            // Add more country-language mappings as needed
        };

        const detectedLang = countryToLang[data.country_code] || 'en';

        return json({ 
            country: data.country_code,
            language: detectedLang
        });
    } catch (error) {
        console.error('Geolocation error:', error);
        return json({ language: 'en' });
    }
} 