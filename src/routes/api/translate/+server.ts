import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { callOpenAI } from '$lib/api/openai';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { text, targetLanguage } = await request.json();

		if (!text || !targetLanguage) {
			return json({ error: 'Missing required parameters' }, { status: 400 });
		}

		try {
			const result = await callOpenAI('chat/completions', {
				model: 'gpt-3.5-turbo',
				messages: [
					{
						role: 'system',
						content: `You are a translation assistant. Translate the following text to ${targetLanguage}. Only return the translated text, nothing else.`
					},
					{
						role: 'user',
						content: text
					}
				],
				temperature: 0.3,
				max_tokens: 1000
			});

			const translation = result.choices[0]?.message?.content?.trim();

			if (!translation) {
				return json({ error: 'No translation generated' }, { status: 500 });
			}

			return json({ translation });
		} catch (apiError) {
			console.error('OpenAI API Error:', apiError);
			return json({ error: 'Failed to translate text' }, { status: 500 });
		}
	} catch (error) {
		console.error('Error translating text:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
