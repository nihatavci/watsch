import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { callOpenAI } from '$lib/api/openai';
import { OPENAI_API_KEY } from '$lib/env-loader';

export const POST: RequestHandler = async ({ request, fetch }) => {
	try {
		const { prompt } = await request.json();
		console.log('[Debug] OPENAI_API_KEY:', OPENAI_API_KEY ? OPENAI_API_KEY.substring(0, 8) + '...' : 'NOT SET');
		if (!OPENAI_API_KEY) {
			console.error('[Error] OPENAI_API_KEY is not configured');
			return json({ error: 'OpenAI API key is not configured on the server' }, { status: 500 });
		}
		if (!prompt) {
			return json({ error: 'Prompt is required' }, { status: 400 });
		}
		try {
			const result = await callOpenAI(
				'chat/completions',
				{
					model: 'gpt-3.5-turbo',
					messages: [{ role: 'user', content: prompt }],
					temperature: 0.7,
					max_tokens: 1500
				},
				fetch
			);
			return json({
				response: result.choices[0]?.message?.content || 'No response generated'
			});
		} catch (apiError) {
			console.error('[Error] OpenAI API error:', apiError);
			return json({ error: 'Failed to generate response from AI', details: apiError instanceof Error ? apiError.stack : apiError }, { status: 500 });
		}
	} catch (error) {
		console.error('[Error] Exception in automated-prompt:', error);
		return json({ error: 'Internal server error', details: error instanceof Error ? error.stack : error }, { status: 500 });
	}
};
