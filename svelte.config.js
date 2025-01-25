import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		env: {
			dir: '.',
			privatePrefix: 'PRIVATE_',
			publicPrefix: 'PUBLIC_'
		}
	},
	preprocess: vitePreprocess()
};

export default config;
