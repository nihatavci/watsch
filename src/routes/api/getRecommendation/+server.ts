import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY, TMDB_API_KEY } from '$env/static/private';

async function getAIRecommendations(prompt: string) {
	try {
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${OPENAI_API_KEY}`
			},
			body: JSON.stringify({
				model: "gpt-3.5-turbo",
				messages: [{
					role: "system",
					content: "You are a movie recommendation expert. Provide recommendations in the format: '1. Movie Title: Brief description'"
				}, {
					role: "user",
					content: `Suggest 5 movies based on these criteria: ${prompt}. Focus on providing diverse, high-quality recommendations that match the specified genres and preferences.`
				}],
				temperature: 0.7,
				max_tokens: 500
			})
		});

		const data = await response.json();
		return data.choices[0].message.content.split('\n').filter(line => line.trim());
	} catch (error) {
		console.error('OpenAI API Error:', error);
		throw error;
	}
}

async function getTMDBDetails(title: string) {
	try {
		const response = await fetch(
			`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=en-US&page=1&include_adult=false`
		);
		
		const data = await response.json();
		if (data.results && data.results.length > 0) {
			const movie = data.results[0];
			return {
				title: movie.title,
				description: movie.overview,
				year: new Date(movie.release_date).getFullYear(),
				rating: movie.vote_average,
				poster_path: movie.poster_path,
				tmdb_id: movie.id
			};
		}
		return null;
	} catch (error) {
		console.error('TMDB API Error:', error);
		return null;
	}
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { searched } = await request.json();
		
		if (!searched) {
			return json({ error: "Search criteria is required" }, { status: 400 });
		}

		// Get AI recommendations
		const aiRecommendations = await getAIRecommendations(searched);
		
		// Process each recommendation and get TMDB details
		const processedRecommendations = [];
		for (const rec of aiRecommendations) {
			const match = rec.match(/^\d+\.\s*([^:]+):/);
			if (match) {
				const title = match[1].trim();
				const tmdbDetails = await getTMDBDetails(title);
				if (tmdbDetails) {
					processedRecommendations.push(
						`${rec.split(':')[0]}: ${tmdbDetails.title}: ${tmdbDetails.description}`
					);
				}
			}
		}

		// If we don't have enough recommendations, fill with AI suggestions
		const finalRecommendations = processedRecommendations.length > 0 ? 
			processedRecommendations : aiRecommendations;

		return new Response(finalRecommendations.join('\n'), {
			headers: { 'Content-Type': 'text/plain' }
		});
	} catch (error) {
		console.error('Error generating recommendation:', error);
		return json(
			{ error: "Failed to generate recommendation" },
			{ status: 500 }
		);
	}
};