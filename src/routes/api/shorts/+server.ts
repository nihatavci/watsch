import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getEnvVariables } from '$lib/env';

interface InstagramPost {
	id: string;
	caption: string;
	media_type: string;
	media_url: string;
	thumbnail_url?: string;
	permalink: string;
	timestamp: string;
}

// For testing, we'll use sample video data until we get the API working
const SAMPLE_SHORTS = [
	{
		id: '1',
		videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
		caption: 'The Avengers: Epic battle scene #movies #action'
	},
	{
		id: '2',
		videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
		caption: 'Inception: Mind-bending sequences #movies #scifi'
	},
	{
		id: '3',
		videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
		caption: 'The Dark Knight: Joker scenes #movies #batman'
	}
];

export const GET: RequestHandler = async () => {
	try {
		const env = await getEnvVariables();

		if (!env.RAPID_API_KEY) {
			console.error('RAPID_API_KEY is not defined');
			return json({ error: 'API configuration error' }, { status: 500 });
		}

		const options = {
			method: 'GET',
			headers: {
				'X-RapidAPI-Host': 'instagram-scraper-2022.p.rapidapi.com',
				'X-RapidAPI-Key': env.RAPID_API_KEY
			}
		};

		const response = await fetch(
			'https://instagram-scraper-2022.p.rapidapi.com/ig/posts_username/?user=watsch.tv',
			options
		);

		if (!response.ok) {
			throw new Error('Failed to fetch Instagram posts');
		}

		const data = await response.json();

		if (!data.data || !Array.isArray(data.data)) {
			return json({ posts: [] });
		}

		const posts: InstagramPost[] = data.data
			.filter((post: any) => post.media_type === 'IMAGE' || post.media_type === 'VIDEO')
			.map((post: any) => ({
				id: post.id,
				caption: post.caption || '',
				media_type: post.media_type,
				media_url: post.media_url,
				thumbnail_url: post.thumbnail_url,
				permalink: post.permalink,
				timestamp: post.timestamp
			}));

		return json({ posts });
	} catch (error) {
		console.error('Error fetching Instagram posts:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch Instagram posts' },
			{ status: 500 }
		);
	}
};
