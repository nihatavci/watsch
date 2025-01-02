<script lang="ts">
    import { onMount } from 'svelte';
    import Button from './ui/button.svelte';

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
</script>

{#if isMobile && showBanner}
    <div 
        class="fixed bottom-4 left-4 right-4 z-[9999] bg-[#221F1F] border border-[#E50914]/20 rounded-xl p-4 
               flex items-center justify-between shadow-lg backdrop-blur-sm animate-in slide-in-from-bottom-10"
    >
        <div class="flex items-center space-x-4">
            <img src="/icons/icon-192x192.png" alt="Watsch App" class="w-12 h-12 rounded-lg" />
            <div>
                <h3 class="font-bold text-white">Install Watsch App</h3>
                <p class="text-sm text-white/70">Get quick movie recommendations on your mobile</p>
            </div>
        </div>
        <Button 
            variant="default" 
            size="sm" 
            on:click={handleInstall}
            class="bg-[#E50914] hover:bg-[#B20710] text-white"
        >
            Install
        </Button>
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