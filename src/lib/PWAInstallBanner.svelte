<script lang="ts">
    import { onMount } from 'svelte';
    import Button from './ui/button.svelte';
    import { fade, fly } from 'svelte/transition';

    let deferredPrompt: any = null;
    let showBanner = false;
    let isMobile = false;

    function isPWAInstallable() {
        // Check if running in browser
        if (typeof window === 'undefined') return false;

        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           (window.navigator as any).standalone || 
                           document.referrer.includes('android-app://');
        
        const isMobileDevice = /Android|iPhone|iPad|iPod|Mobile|Opera Mini/i.test(navigator.userAgent);
        
        return !isStandalone && isMobileDevice;
    }

    onMount(() => {
        try {
            isMobile = isPWAInstallable();

            if (isMobile) {
                // Listen for native install prompt
                window.addEventListener('beforeinstallprompt', (e) => {
                    e.preventDefault();
                    deferredPrompt = e;
                    showBanner = true;
                });

                window.addEventListener('appinstalled', () => {
                    showBanner = false;
                    deferredPrompt = null;
                });

                // For testing: Show banner after 2 seconds
                // This will work in development mode
                setTimeout(() => {
                    if (!showBanner && process.env.NODE_ENV === 'development') {
                        console.log('Showing test banner');
                        showBanner = true;
                    }
                }, 2000);
            }
        } catch (error) {
            console.error('Error in PWA banner setup:', error);
        }
    });

    async function handleInstall() {
        if (deferredPrompt) {
            try {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    showBanner = false;
                    deferredPrompt = null;
                }
            } catch (error) {
                console.error('Installation error:', error);
            }
        } else {
            // For testing: Just hide the banner when clicked
            if (process.env.NODE_ENV === 'development') {
                showBanner = false;
            }
        }
    }

    function handleDismiss() {
        showBanner = false;
    }
</script>

{#if showBanner}
    <div 
        class="fixed bottom-0 left-0 right-0 z-[9999] bg-[#1A1A1A] border-t border-[#2C2C2C] p-4"
        in:fly={{ y: 50, duration: 300 }}
        out:fade={{ duration: 200 }}
    >
        <!-- Close Button -->
        <button 
            on:click={handleDismiss}
            class="absolute top-2 right-2 p-2 text-white/50 hover:text-white/70"
        >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>

        <div class="flex items-start gap-4">
            <!-- App Icon -->
            <div class="relative">
                <div class="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
                    <svg class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </div>
                <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#E50914] flex items-center justify-center">
                    <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                </div>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
                <h3 class="font-bold text-white text-lg">Install Watsch App</h3>
                <p class="text-sm text-white/70 mb-3">Add to your home screen for quick access</p>
                
                <div class="flex items-center gap-4">
                    <button 
                        on:click={handleInstall}
                        class="px-6 py-2 bg-[#E50914] text-white font-medium rounded-full hover:bg-[#B20710] transition-colors"
                    >
                        Install Now
                    </button>
                    <button 
                        on:click={handleDismiss}
                        class="text-white/50 hover:text-white/70 transition-colors"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>

        <!-- Features -->
        <div class="mt-4 flex items-center gap-6 text-sm text-white/50">
            <div class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Faster Access
            </div>
            <div class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Get Notifications
            </div>
        </div>
    </div>
{/if}

<style>
    .animate-in {
        animation: slide-in-from-bottom 0.3s ease-out;
    }

    @keyframes slide-in-from-bottom {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style> 