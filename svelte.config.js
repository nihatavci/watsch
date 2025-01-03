import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			// Remove the runtime specification as Vercel will auto-detect it
		})
	},
	preprocess: vitePreprocess()
};

export default config;
