// src/stores/installPrompt.ts
import { writable } from 'svelte/store';

export const installPrompt = writable<BeforeInstallPromptEvent | null>(null);

export function setupInstallPrompt() {
	window.addEventListener('beforeinstallprompt', (e: Event) => {
		e.preventDefault();
		installPrompt.set(e as BeforeInstallPromptEvent);
	});
}
