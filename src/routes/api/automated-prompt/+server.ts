import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getEnvVariables } from '$lib/env';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const env = await getEnvVariables();
        const { text } = await request.json();

        if (!text) {
            return json({ error: 'Missing text parameter' }, { status: 400 });
        }

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
                        content: 'You are a helpful assistant that generates prompts for movie recommendations.'
                    },
                    {
                        role: 'user',
                        content: text
                    }
                ],
                temperature: 0.7,
                max_tokens: 200
            })
        });

        if (!response.ok) {
            console.error('OpenAI API Error:', await response.text());
            return json({ error: 'Failed to generate prompt' }, { status: 500 });
        }

        const data = await response.json();
        const generatedPrompt = data.choices[0]?.message?.content?.trim();

        if (!generatedPrompt) {
            return json({ error: 'No prompt generated' }, { status: 500 });
        }

        return json({ prompt: generatedPrompt });
    } catch (error) {
        console.error('Error generating prompt:', error);
        return json({ error: 'Failed to generate prompt' }, { status: 500 });
    }
}; 