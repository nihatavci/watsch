import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { callOpenAI } from '$lib/api/openai';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { prompt } = await request.json();

		if (!prompt) {
			return json({ error: 'Prompt is required' }, { status: 400 });
		}

		try {
			const result = await callOpenAI('chat/completions', {
				model: 'gpt-3.5-turbo',
				messages: [{ role: 'user', content: prompt }],
				temperature: 0.7,
				max_tokens: 1500
			});

			return json({
				response: result.choices[0]?.message?.content || 'No response generated'
			});
		} catch (apiError) {
			console.error('OpenAI API error:', apiError);
			return json({ error: 'Failed to generate response from AI' }, { status: 500 });
		}
	} catch (error) {
		console.error('Error processing prompt:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
