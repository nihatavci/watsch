import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PRIVATE_RAPID_API_KEY } from '$env/static/private';

interface InstagramPost {
    video_url: string;
    caption: string;
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
    if (!PRIVATE_RAPID_API_KEY) {
        console.error('RAPID_API_KEY is not defined');
        return new Response('Server configuration error', { status: 500 });
    }

    try {
        const url = 'https://social-media-api6.p.rapidapi.com/instagram/user/reels';
        console.log('Fetching from:', url);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'X-RapidAPI-Key': PRIVATE_RAPID_API_KEY,
                'X-RapidAPI-Host': 'social-media-api6.p.rapidapi.com'
            },
            body: JSON.stringify({
                username: 'moviepulsee'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Response not OK:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });
            throw new Error(`API responded with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('API Response:', data);
        
        if (!data.reels) {
            console.error('Unexpected API response structure:', data);
            throw new Error('Unexpected API response structure');
        }

        const shorts = data.reels
            .filter((post: any) => post.video_url)
            .map((post: any) => ({
                id: post.id || String(Math.random()),
                videoUrl: post.video_url,
                caption: post.caption || 'No caption'
            }));

        if (shorts.length === 0) {
            console.log('No video posts found in the response');
            // Return sample data as fallback if no videos found
            return json(SAMPLE_SHORTS);
        }

        console.log(`Successfully fetched ${shorts.length} video posts`);
        return json(shorts);
    } catch (error) {
        console.error('Error fetching Instagram data:', error);
        // Return sample data as fallback if API fails
        return json(SAMPLE_SHORTS);
    }
}; 