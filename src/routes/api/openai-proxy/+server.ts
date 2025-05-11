import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

const OPENAI_API_KEY = env.OPENAI_API_KEY;
const OPENAI_BASE_URL = 'https://api.openai.com/v1';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Ensure API key exists
		if (!OPENAI_API_KEY) {
			console.error('ERROR: OPENAI_API_KEY is not defined in environment variables!');
			return json({ error: 'OpenAI API key is not configured on the server' }, { status: 500 });
		}

		// Extract model and payload from the request
		const { model, messages, temperature = 0.7, max_tokens = 1000 } = await request.json();

		// Ensure required parameters are provided
		if (!model || !messages || !Array.isArray(messages) || messages.length === 0) {
			return json(
				{ error: 'Invalid request parameters. Required: model, messages' },
				{ status: 400 }
			);
		}

		// Log (for debugging, without revealing the key)
		console.log(`OpenAI API request: model=${model}, messages.length=${messages.length}`);

		// Make the request to OpenAI
		const openAiResponse = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${OPENAI_API_KEY}`
			},
			body: JSON.stringify({
				model,
				messages,
				temperature,
				max_tokens
			})
		});

		// Parse the response
		const responseData = await openAiResponse.json();

		// Handle errors from OpenAI
		if (!openAiResponse.ok) {
			console.error('OpenAI API error:', responseData);
			return json(
				{
					error: responseData.error?.message || 'OpenAI API request failed',
					details: responseData.error
				},
				{ status: openAiResponse.status }
			);
		}

		// Return successful response
		return json(responseData);
	} catch (error) {
		console.error('Error in OpenAI proxy:', error);
		return json({ error: 'Internal server error processing OpenAI request' }, { status: 500 });
	}
};
