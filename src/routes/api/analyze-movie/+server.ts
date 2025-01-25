import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getEnvVariables } from '$lib/env';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { title, overview, genres, rating, language } = await request.json();

		if (!title || !overview) {
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
						content: `You are a movie expert. Analyze the movie and provide 3-4 concise, specific tags in ${language || 'en'}. Focus on:
						1. Target audience (e.g., "Perfect for families", "Great for teens", "Date night pick")
						2. Viewing experience (e.g., "Binge-worthy", "Intense thriller", "Feel-good movie")
						3. Content highlights (e.g., "Strong female lead", "Mind-bending plot", "Beautiful animation")
						4. Mood/Atmosphere (e.g., "Dark humor", "Heartwarming story", "Action-packed")
						
						Keep each tag under 4 words. Don't use generic tags. Make them specific and helpful for viewers.
						Return only the tags, one per line, without numbers or bullet points.`
					},
					{
						role: 'user',
						content: `Title: ${title}\nOverview: ${overview}\nGenres: ${genres?.join(', ')}\nRating: ${rating}`
					}
				],
				temperature: 0.7,
				max_tokens: 200
			})
		});

		if (!response.ok) {
			console.error('OpenAI API Error:', await response.text());
			return json({ insights: [] }, { status: 200 }); // Return empty insights instead of failing
		}

		const data = await response.json();
		const analysis = data.choices[0]?.message?.content;

		// Split the analysis into individual insights and clean them up
		const insights = analysis
			?.split('\n')
			.map((insight: string) => insight.trim())
			.filter((insight: string) => insight.length > 0) || [];

		return json({ insights });
	} catch (error) {
		console.error('Error analyzing movie:', error);
		return json({ insights: [] }, { status: 200 }); // Return empty insights on error
	}
}; 