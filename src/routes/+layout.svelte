<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../app.css';
	import { dev } from '$app/environment';
	import { inject } from '@vercel/analytics';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
  
	// Create a writable store for managing the install prompt state
	export const installPrompt = writable<BeforeInstallPromptEvent | null>(null);
  
	let promptEvent: BeforeInstallPromptEvent | null = null;
	installPrompt.subscribe((value) => {
	  promptEvent = value;
	});
  
	onMount(() => {
	  window.addEventListener('beforeinstallprompt', (e) => {
		e.preventDefault(); // Prevent the mini-infobar from appearing on mobile
		installPrompt.set(e);
	  });
  
	  if ('serviceWorker' in navigator) {
		window.addEventListener('load', () => {
		  navigator.serviceWorker
			.register('/service-worker.js')
			.then((registration) => {
			  console.log('Service Worker registered with scope:', registration.scope);
			})
			.catch((error) => {
			  console.log('Service Worker registration failed:', error);
			});
		});
	  }
	});
  
	function installApp() {
	  if (promptEvent) {
		promptEvent.prompt();
		promptEvent.userChoice.then((choiceResult) => {
		  if (choiceResult.outcome === 'accepted') {
			console.log('User accepted the A2HS prompt');
		  } else {
			console.log('User dismissed the A2HS prompt');
		  }
		  installPrompt.set(null); // Reset the prompt event after handling
		});
	  }
	}
  
	inject({ mode: dev ? 'development' : 'production' });
  </script>
  
  <div class="min-h-screen w-full">
	<slot />
	{#if promptEvent}
	  <button id="installButton" on:click={installApp} class="p-2 bg-blue-500 text-white rounded">
		Install App
	  </button>
	{/if}
  </div>
  