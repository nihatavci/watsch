import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getEnvVariables } from '$lib/env';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { text, targetLanguage, context } = await request.json();

		if (!text || !targetLanguage) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		const env = await getEnvVariables();

		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${env.OPENAI_API_KEY}`
			},
			body: JSON.stringify({
				model: 'gpt-3.5-turbo',
				messages: [
					{
						role: 'system',
						content: `You are a professional translator specializing in movie and TV show content. 
						Translate the following ${context} from English to ${targetLanguage}. 
						Maintain the original tone and style. Only respond with the translation.`
					},
					{
						role: 'user',
						content: text
					}
				],
				temperature: 0.3,
				max_tokens: 1000
			})
		});

		if (!response.ok) {
			console.error('OpenAI API Error:', await response.text());
			return json({ translatedText: text }, { status: 200 }); // Fallback to original text
		}

		const data = await response.json();
		const translatedText = data.choices[0]?.message?.content?.trim();

		if (!translatedText) {
			console.error('No translation received');
			return json({ translatedText: text }, { status: 200 }); // Fallback to original text
		}

		return json({ translatedText });
	} catch (error) {
		console.error('Translation error:', error);
		const { text } = await request.json();
		return json({ translatedText: text }, { status: 200 }); // Fallback to original text
	}
}; 