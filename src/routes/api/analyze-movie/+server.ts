import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY } from '$env/static/private';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { title, overview, genres, rating } = await request.json();

		const prompt = `Analyze this movie and provide 2-3 short insights about its target audience and content. Movie details:
Title: ${title}
Overview: ${overview}
Genres: ${genres.join(', ')}
Rating: ${rating}

Focus on aspects like:
- Family-friendliness
- Age appropriateness
- Notable themes or content warnings
- Educational value
- Emotional impact

Provide insights in a concise format, each 2-4 words long.`;

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
						content: 'You are a movie analyst providing concise insights about movies. Keep responses very brief.'
					},
					{
						role: 'user',
						content: prompt
					}
				],
				temperature: 0.7,
				max_tokens: 150
			})
		});

		if (!response.ok) {
			throw new Error('Failed to analyze movie');
		}

		const data = await response.json();
		const insights: string[] = data.choices[0].message.content
			.split('\n')
			.filter((line: string) => line.length > 0)
			.map((insight: string) => insight.replace(/^[-•*]\s*/, '').trim())
			.filter((insight: string) => insight.length > 0 && insight.length < 25);

		return json({ insights: insights.slice(0, 3) });
	} catch (error) {
		console.error('Error analyzing movie:', error);
		return json({ insights: [] });
	}
}; 