import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { text, targetLanguage } = await request.json();
		if (!text || !targetLanguage) {
			return json({ error: 'Missing required parameters' }, { status: 400 });
		}

		// Google Translate public API (unofficial, for demo/dev use)
		const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLanguage)}&dt=t&q=${encodeURIComponent(text)}`;
		const response = await fetch(url);
		if (!response.ok) {
			console.error('[Google Translate] API error:', await response.text());
			return json({ error: 'Failed to translate text' }, { status: 500 });
		}
		const data = await response.json();
		// The translated text is in data[0][0][0]
		const translation = data?.[0]?.[0]?.[0] || text;
		return json({ translation });
	} catch (error) {
		console.error('[Google Translate] Exception:', error);
		return json({ error: 'Internal server error', details: error instanceof Error ? error.stack : error }, { status: 500 });
	}
};
