<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../app.css';
	import { dev } from '$app/environment';
	import { inject } from '@vercel/analytics';
	import { onMount } from 'svelte';
	import { installPrompt, setupInstallPrompt } from '../stores/installPrompt';
  
	let promptEvent: BeforeInstallPromptEvent | null = null;
	installPrompt.subscribe((value) => {
	  promptEvent = value;
	});
  
	onMount(() => {
	  setupInstallPrompt();
  
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
		  installPrompt.set(null);
		});
	  }
	}
  
	inject({ mode: dev ? 'development' : 'production' });
  </script>
  
  <div class="min-h-screen w-full">
	<slot />
	{#if promptEvent}
	  <button id="installButton" on:click={installApp}>
		Install App
	  </button>
	{/if}
  </div>
  