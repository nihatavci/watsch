import { OPENAI_API_KEY } from '$lib/env-loader';

// OpenAI API configuration
const config = {
	apiKey: OPENAI_API_KEY,
	baseURL: 'https://api.openai.com/v1'
};

/**
 * OpenAI API helper that uses our internal proxy
 */

/**
 * Function to make requests to the OpenAI API via our internal proxy
 * @param endpoint - The OpenAI API endpoint (e.g. 'chat/completions')
 * @param payload - The payload to send to the OpenAI API
 * @param fetch - The fetch function to use (from event.fetch in server context)
 */
export async function callOpenAI(endpoint: string, payload: any, fetch: typeof globalThis.fetch) {
	try {
		console.log('Making OpenAI API request via proxy');

		// Only support chat completions for now
		if (endpoint !== 'chat/completions') {
			throw new Error(`Unsupported OpenAI endpoint: ${endpoint}`);
		}

		// If the API key is missing, return an error
		if (!OPENAI_API_KEY) {
			console.error('ERROR: OPENAI_API_KEY is not defined in environment variables!');
			throw new Error('OpenAI API key is not configured on the server');
		}

		// Make direct OpenAI API call using the API key from environment
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${OPENAI_API_KEY}`
			},
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			const errorData = await response.json();
			console.error('OpenAI API error response:', errorData);
			throw new Error(errorData.error?.message || 'OpenAI API request failed');
		}

		return await response.json();
	} catch (error) {
		console.error('Error calling OpenAI API:', error);
		throw error;
	}
}

/**
 * Generate text using OpenAI's GPT models
 * @param prompt - The text prompt to send to OpenAI
 * @param options - Additional options for the request
 * @param fetch - The fetch function to use (from event.fetch in server context)
 */
export async function generateText(
	prompt: string,
	options: any = {},
	fetch: typeof globalThis.fetch
) {
	const defaultOptions = {
		model: 'gpt-4',
		max_tokens: 1000,
		temperature: 0.7
	};

	const payload = {
		...defaultOptions,
		...options,
		messages: [{ role: 'user', content: prompt }]
	};

	return callOpenAI('chat/completions', payload, fetch);
}

/**
 * Generate movie analysis using OpenAI
 * @param movieInfo - The movie information to analyze
 * @param fetch - The fetch function to use (from event.fetch in server context)
 */
export async function analyzeMovie(movieInfo: any, fetch: typeof globalThis.fetch) {
	const prompt = `
    Analyze the following movie information and provide insights:
    Title: ${movieInfo.title}
    Overview: ${movieInfo.overview}
    Genre: ${movieInfo.genres?.map((g: any) => g.name).join(', ') || 'Not specified'}
    Release Date: ${movieInfo.release_date || 'Not specified'}
    
    Please provide:
    1. A brief analysis of the movie's themes
    2. Similar movies that viewers might enjoy
    3. What makes this movie unique
  `;

	return generateText(prompt, { temperature: 0.8 }, fetch);
}
