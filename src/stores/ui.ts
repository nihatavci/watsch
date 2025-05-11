import { writable } from 'svelte/store';

// Store for pulsing the saved icon in the navbar
export const savedIconPulse = writable(false);

// Function to trigger the saved icon pulse effect
export function pulseSavedIcon() {
	savedIconPulse.set(true);

	// Automatically turn off the pulse after a delay
	setTimeout(() => {
		savedIconPulse.set(false);
	}, 2000);
}
