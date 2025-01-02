<script>
  import { onMount } from 'svelte';
  let showBanner = false;

  onMount(() => {
    if ('serviceWorker' in navigator && !window.matchMedia('(display-mode: standalone)').matches) {
      showBanner = true;
    }
  });

  function installPWA() {
    window.deferredPrompt?.prompt();
    window.deferredPrompt = null;
    showBanner = false;
  }
</script>

{#if showBanner}
  <div class="fixed bottom-0 left-0 right-0 bg-[#E50914] text-white p-4 flex justify-between items-center">
    <span>Install this app for a better experience</span>
    <button on:click={installPWA} class="px-4 py-2 bg-white text-[#E50914] rounded-lg">
      Install
    </button>
  </div>
{/if} 