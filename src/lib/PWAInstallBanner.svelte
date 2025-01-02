<script lang="ts">
    import { onMount } from 'svelte';
    import Button from './ui/button.svelte';
    import { fade, fly } from 'svelte/transition';

    let deferredPrompt: any = null;
    let showBanner = false;
    let isMobile = false;

    onMount(() => {
        // Check if it's a mobile device
        isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        // Only add event listeners on mobile
        if (isMobile) {
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                showBanner = true;
                console.log('PWA install prompt detected');
            });

            window.addEventListener('appinstalled', () => {
                showBanner = false;
                deferredPrompt = null;
                console.log('App installed successfully');
            });
        }
    });

    async function handleInstall() {
        if (deferredPrompt) {
            try {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                
                if (outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                    showBanner = false;
                    deferredPrompt = null;
                } else {
                    console.log('User dismissed the install prompt');
                }
            } catch (error) {
                console.error('Error during installation:', error);
            }
        }
    }

    function handleDismiss() {
        showBanner = false;
    }
</script>

{#if isMobile && showBanner}
    <div 
        class="fixed bottom-4 left-4 right-4 z-[9999]"
        in:fly={{ y: 50, duration: 300 }}
        out:fade={{ duration: 200 }}
    >
        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1A1A1A] to-[#2C2C2C] border border-[#E50914]/20 shadow-xl backdrop-blur-lg">
            <!-- Close Button -->
            <button 
                on:click={handleDismiss}
                class="absolute top-3 right-3 p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
                <svg class="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div class="p-4 flex items-center gap-4">
                <!-- App Icon -->
                <div class="relative flex-shrink-0">
                    <img 
                        src="/icons/icon-192x192.png" 
                        alt="Watsch App" 
                        class="w-16 h-16 rounded-2xl shadow-lg"
                    />
                    <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#E50914] flex items-center justify-center shadow-lg">
                        <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-lg text-white mb-0.5">Install Watsch App</h3>
                    <p class="text-sm text-white/70 mb-3">Add to your home screen for quick access</p>
                    
                    <div class="flex items-center gap-3">
                        <Button 
                            variant="default" 
                            size="sm" 
                            on:click={handleInstall}
                            class="bg-[#E50914] hover:bg-[#B20710] text-white shadow-lg shadow-[#E50914]/20"
                        >
                            Install Now
                        </Button>
                        <button 
                            on:click={handleDismiss}
                            class="text-sm text-white/50 hover:text-white/70 transition-colors"
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>
            </div>

            <!-- Features Preview -->
            <div class="px-4 pb-4 flex items-center gap-4 text-xs text-white/50">
                <div class="flex items-center gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Faster Access
                </div>
                <div class="flex items-center gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Works Offline
                </div>
                <div class="flex items-center gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Get Notifications
                </div>
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