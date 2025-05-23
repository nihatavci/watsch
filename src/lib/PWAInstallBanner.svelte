<script lang="ts">
	import { onMount } from 'svelte';
	import { i18nStore } from './i18n';
	import { fade } from 'svelte/transition';

	interface BeforeInstallPromptEvent extends Event {
		prompt: () => Promise<void>;
		userChoice: Promise<{
			outcome: 'accepted' | 'dismissed';
			platform: string;
		}>;
	}

	let deferredPrompt: BeforeInstallPromptEvent | null = null;
	let showBanner = false;
	let isMobileDevice = false;
	let isIOS = false;
	let isInstallable = false;

	function checkIfMobile() {
		const userAgent = navigator.userAgent.toLowerCase();
		isIOS = /iphone|ipad|ipod/.test(userAgent);
		return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
	}

	function checkIfInstallable() {
		// Check if already installed
		const isStandalone =
			window.matchMedia('(display-mode: standalone)').matches ||
			(window.navigator as any).standalone ||
			document.referrer.includes('android-app://');

		// Check if banner was dismissed in the last 24 hours
		const dismissedTime = localStorage.getItem('pwa-banner-dismissed-time');
		const isDismissed = dismissedTime && Date.now() - parseInt(dismissedTime) < 24 * 60 * 60 * 1000;

		// Show banner if mobile, not installed, not dismissed, and either iOS or has install prompt
		return !isStandalone && !isDismissed && isMobileDevice && (isIOS || deferredPrompt !== null);
	}

	function updateInstallableStatus() {
		isInstallable = checkIfInstallable();
		showBanner = isInstallable;
	}

	onMount(() => {
		isMobileDevice = checkIfMobile();

		if (isMobileDevice) {
			// Listen for beforeinstallprompt event
			window.addEventListener('beforeinstallprompt', (e) => {
				e.preventDefault();
				deferredPrompt = e as BeforeInstallPromptEvent;
				updateInstallableStatus();
			});

			// Listen for appinstalled event
			window.addEventListener('appinstalled', () => {
				showBanner = false;
				localStorage.setItem('pwa-installed', 'true');
			});

			// Check display mode changes
			window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
				if (e.matches) {
					showBanner = false;
				}
			});

			// Initial check
			updateInstallableStatus();
		}
	});

	async function installApp() {
		if (isIOS) {
			// Show iOS-specific instructions
			const instructions = $i18nStore.t(
				'pwa.ios_instructions',
				'To install on iOS:\n1. Tap the Share button (rectangle with arrow)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" in the top right'
			);
			alert(instructions);
			dismissBanner();
			return;
		}

		if (deferredPrompt) {
			try {
				await deferredPrompt.prompt();
				const { outcome } = await deferredPrompt.userChoice;

				if (outcome === 'accepted') {
					showBanner = false;
					localStorage.setItem('pwa-installed', 'true');
				}

				// Clear the prompt
				deferredPrompt = null;
			} catch (error) {
				console.error('Installation error:', error);
				// Show fallback instructions
				alert(
					$i18nStore.t(
						'pwa.install_error',
						'Installation failed. Please try using your browser\'s "Add to Home Screen" option.'
					)
				);
			}
		}
	}

	function dismissBanner() {
		showBanner = false;
		localStorage.setItem('pwa-banner-dismissed-time', Date.now().toString());
	}
</script>

{#if showBanner}
	<div
		class="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-50"
		transition:fade={{ duration: 300 }}
	>
		<div
			class="bg-[#1A1A1A]/95 backdrop-blur-sm border border-[#E50914]/20 rounded-xl p-4 shadow-lg"
		>
			<div class="flex items-start gap-4">
				<div class="flex-shrink-0">
					<div class="w-12 h-12 rounded-xl bg-[#E50914]/10 flex items-center justify-center">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="w-6 h-6 text-[#E50914]"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
							/>
						</svg>
					</div>
				</div>
				<div class="flex-1">
					<h3 class="text-lg font-semibold text-white mb-1">
						{isIOS
							? $i18nStore.t('pwa.install_title_ios', 'Add to Home Screen')
							: $i18nStore.t('pwa.install_title', 'Install Watsch App')}
					</h3>
					<p class="text-sm text-white/70 mb-3">
						{isIOS
							? $i18nStore.t(
									'pwa.install_description_ios',
									'Install Watsch for the best experience'
							  )
							: $i18nStore.t('pwa.install_description', 'Add to your home screen for quick access')}
					</p>
					<div class="flex flex-wrap gap-2">
						<button
							class="px-4 py-2 bg-[#E50914] hover:bg-[#B20710] text-white rounded-lg transition-colors text-sm font-medium"
							on:click={installApp}
						>
							{isIOS
								? $i18nStore.t('pwa.show_instructions', 'Show Instructions')
								: $i18nStore.t('pwa.install_now', 'Install Now')}
						</button>
						<button
							class="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white/90 rounded-lg transition-colors text-sm"
							on:click={dismissBanner}
						>
							{$i18nStore.t('pwa.maybe_later', 'Maybe Later')}
						</button>
					</div>
				</div>
				<button
					class="flex-shrink-0 text-white/50 hover:text-white transition-colors"
					on:click={dismissBanner}
					aria-label={$i18nStore.t('pwa.close', 'Close')}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
			</div>
			<div class="mt-3 flex items-center gap-3 text-xs text-white/50">
				<div class="flex items-center gap-1">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 10V3L4 14h7v7l9-11h-7z"
						/>
					</svg>
					{$i18nStore.t('pwa.faster_access', 'Faster Access')}
				</div>
				<div class="flex items-center gap-1">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
						/>
					</svg>
					{$i18nStore.t('pwa.get_notifications', 'Get Notifications')}
				</div>
			</div>
		</div>
	</div>
{/if}
