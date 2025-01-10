import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY } from '$env/static/private';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { searched } = await request.json();

		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${OPENAI_API_KEY}`
			},
			body: JSON.stringify({
				model: 'gpt-3.5-turbo',
				messages: [
					{
						role: 'system',
						content: `You are a movie and TV show recommendation expert. 
						Provide recommendations in a numbered list format (1. Title: Description).
						Focus on providing diverse, high-quality recommendations that match the specified criteria.
						Include a mix of popular and critically acclaimed titles.
						Keep descriptions concise but informative, highlighting key aspects that match the search criteria.
						Format each recommendation exactly as: "1. Title: Brief, engaging description"`
					},
					{
						role: 'user',
						content: searched
					}
				],
				temperature: 0.8,
				max_tokens: 1000,
				presence_penalty: 0.6,
				frequency_penalty: 0.6
			})
		});

		if (!response.ok) {
			const errorData = await response.json();
			console.error('OpenAI API error:', errorData);
			throw new Error('Failed to get recommendations from OpenAI');
		}

		const data = await response.json();
		const recommendations = data.choices[0].message.content
			.split('\n')
			.filter((line: string) => line.trim() && line.match(/^\d+\./));

		return json({ recommendations });
	} catch (error) {
		console.error('Error in getRecommendation:', error);
		return json({ error: 'Failed to get recommendations' }, { status: 500 });
	}
};