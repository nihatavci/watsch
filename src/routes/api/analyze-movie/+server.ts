import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { callOpenAI } from '$lib/api/openai';
import { OPENAI_API_KEY } from '$lib/env-loader';

export const POST: RequestHandler = async ({ request, fetch }) => {
	try {
		// Check if OpenAI API key is available
		if (!OPENAI_API_KEY) {
			console.error('OPENAI_API_KEY not available for movie analysis');
			return json(
				{
					insights: [],
					error: 'OpenAI API key is not configured'
				},
				{ status: 200 }
			); // Return 200 to not break the UI
		}

		const { title, overview, genres, rating, language } = await request.json();

		if (!title || !overview) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		const payload = {
			model: 'gpt-3.5-turbo',
			messages: [
				{
					role: 'system',
					content: `You are a movie expert. Analyze the movie and provide 3-4 concise, specific tags in ${
						language || 'en'
					}. Focus on:
					1. Target audience (e.g., "Perfect for families", "Great for teens", "Date night pick")
					2. Viewing experience (e.g., "Binge-worthy", "Intense thriller", "Feel-good movie")
					3. Content highlights (e.g., "Strong female lead", "Mind-bending plot", "Beautiful animation")
					4. Mood/Atmosphere (e.g., "Dark humor", "Heartwarming story", "Action-packed")
					
					Keep each tag under 4 words. Don't use generic tags. Make them specific and helpful for viewers.
					Return only the tags, one per line, without numbers or bullet points.`
				},
				{
					role: 'user',
					content: `Title: ${title}\nOverview: ${overview}\nGenres: ${genres?.join(
						', '
					)}\nRating: ${rating}`
				}
			],
			temperature: 0.7,
			max_tokens: 200
		};

		try {
			const data = await callOpenAI('chat/completions', payload, fetch);
			const analysis = data.choices[0]?.message?.content;

			// Split the analysis into individual insights and clean them up
			const insights =
				analysis
					?.split('\n')
					.map((insight: string) => insight.trim())
					.filter((insight: string) => insight.length > 0) || [];

			return json({ insights });
		} catch (apiError) {
			console.error('OpenAI API Error:', apiError);
			return json({ insights: [], error: 'Failed to generate movie insights' }, { status: 200 });
		}
	} catch (error) {
		console.error('Error analyzing movie:', error);
		return json({ insights: [] }, { status: 200 }); // Return empty insights on error
	}
};
