import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY } from '$env/static/private';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { text, targetLanguage, context } = await request.json();

		if (!text || !targetLanguage) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		const systemPrompt = `You are a professional translator specializing in movie and TV show content. 
Your task is to translate the following text into ${targetLanguage}, maintaining the tone and style appropriate for ${context}.
The translation should feel natural and idiomatic in the target language while preserving the original meaning.
Respond with ONLY the translated text, without any explanations or additional content.`;

		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${OPENAI_API_KEY}`
			},
			body: JSON.stringify({
				model: 'gpt-3.5-turbo',
				messages: [
					{
						role: 'system',
						content: systemPrompt
					},
					{
						role: 'user',
						content: text
					}
				],
				temperature: 0.7,
				max_tokens: 500
			})
		});

		if (!response.ok) {
			throw new Error('OpenAI API request failed');
		}

		const data = await response.json();
		const translatedText = data.choices[0].message.content.trim();

		return json({ translatedText });
	} catch (error) {
		console.error('Translation error:', error);
		return json({ error: 'Translation failed' }, { status: 500 });
	}
}; 