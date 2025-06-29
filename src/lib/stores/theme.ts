import { browser } from '$app/environment';
import { writable } from 'svelte/store';

type ColorMode = 'light' | 'dark';

interface Theme {
	colorMode: ColorMode;
}

// Get initial theme from localStorage or system preference
const getInitialTheme = (): Theme => {
	if (!browser) return { colorMode: 'dark' };

	const savedColorMode = localStorage.getItem('colorMode') as ColorMode;
	
	// Handle backward compatibility - check for old 'theme' key
	const legacyTheme = localStorage.getItem('theme') as ColorMode;
	
	const colorMode = savedColorMode || legacyTheme || 
		(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

	return { colorMode };
};

// Create the theme store
export const theme = writable<Theme>(getInitialTheme());

// Update color mode
export const toggleColorMode = () => {
	theme.update((currentTheme: Theme) => {
		const newColorMode: ColorMode = currentTheme.colorMode === 'light' ? 'dark' : 'light';
		const newTheme: Theme = { ...currentTheme, colorMode: newColorMode };
		
		if (browser) {
			applyTheme(newTheme);
		}
		
		return newTheme;
	});
};

// Apply theme changes to DOM
const applyTheme = (newTheme: Theme) => {
	// Add transitioning class to prevent flicker
	document.documentElement.classList.add('theme-transitioning');

	// Save to localStorage
	localStorage.setItem('colorMode', newTheme.colorMode);
	
	// Clean up legacy keys
	localStorage.removeItem('theme');
	localStorage.removeItem('visualStyle');

	// Apply color mode
	document.documentElement.classList.toggle('dark', newTheme.colorMode === 'dark');

	// Always apply neobrutalism theme
	document.documentElement.classList.remove('glassmorphism-theme');
	document.documentElement.classList.add('neobrutalism-theme');

	// Add haptic feedback
	if (window.navigator.vibrate) {
		window.navigator.vibrate(50);
	}

	// Remove transitioning class after transition completes
	setTimeout(() => {
		document.documentElement.classList.remove('theme-transitioning');
	}, 350);
};

// Initialize theme on load
if (browser) {
	const initialTheme = getInitialTheme();
	applyTheme(initialTheme);
}

// Backward compatibility
export const toggleTheme = toggleColorMode;
