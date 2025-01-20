import { browser } from '$app/environment';
import { writable } from 'svelte/store';

type Theme = 'light' | 'dark';

// Get initial theme from localStorage or system preference
const getInitialTheme = (): Theme => {
	if (!browser) return 'dark';
	
	const savedTheme = localStorage.getItem('theme') as Theme;
	if (savedTheme) return savedTheme;
	
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Create the theme store
export const theme = writable<Theme>(getInitialTheme());

// Update theme and save to localStorage
export const toggleTheme = () => {
	theme.update((currentTheme) => {
		const newTheme = currentTheme === 'light' ? 'dark' : 'light';
		if (browser) {
			localStorage.setItem('theme', newTheme);
			document.documentElement.classList.toggle('dark', newTheme === 'dark');
		}
		return newTheme;
	});
}; 