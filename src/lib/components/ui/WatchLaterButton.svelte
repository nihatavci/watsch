<script lang="ts">
  import { Clock, Check } from 'lucide-svelte';
  import { watchLater, watchLaterItems } from '$lib/stores/watchLater';
  import { authStore } from '$lib/stores/auth';
  import { onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { goto } from '$app/navigation';
  
  export let mediaId: string;
  export let mediaType: 'movie' | 'tv';
  export let title: string;
  export let poster: string = '';
  export let year: number | null = null;
  export let simple: boolean = false; // Simple mode for smaller buttons
  
  let isSaved = false;
  let isAuthenticated = false;
  let isToggling = false;
  let showTooltip = false;
  let mounted = false;
  
  // Subscribe to watchLaterItems to ensure reactivity
  $: {
    // Only check once component is mounted to avoid flickering
    if (mounted && mediaId && mediaType) {
      isSaved = $watchLaterItems.some(item => 
        item.id === mediaId && item.mediaType === mediaType
      );
    }
  }
  
  onMount(() => {
    // Sync watch later items on component mount if authenticated
    const unsubscribe = authStore.subscribe(state => {
      isAuthenticated = state.isAuthenticated;
      if (isAuthenticated) {
        watchLater.sync();
      }
    });
    
    // Mark component as mounted to enable transitions
    mounted = true;
    // Initial check
    if (mediaId && mediaType) {
      isSaved = watchLater.isInWatchLater(mediaId, mediaType);
    }
    
    return unsubscribe;
  });
  
  async function toggleWatchLater() {
    if (!isAuthenticated) {
      showTooltip = true;
      setTimeout(() => {
        showTooltip = false;
      }, 3000);
      return;
    }
    
    if (isToggling) return;
    
    try {
      isToggling = true;
      
      if (isSaved) {
        await watchLater.remove(mediaId, mediaType);
      } else {
        await watchLater.add({
          id: mediaId,
          title,
          mediaType,
          poster,
          year: year || undefined
        });
      }
    } catch (error) {
      console.error('Error toggling watch later status:', error);
    } finally {
      isToggling = false;
    }
  }
  
  function goToLogin() {
    goto('/login');
  }
</script>

<div class="relative">
  <button
    on:click={toggleWatchLater}
    class={`
      transition-all duration-300 
      ${simple ? 'p-2 rounded-lg' : 'px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-sm'}
      ${isSaved 
        ? 'bg-red-500 text-white hover:bg-red-600' 
        : 'bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/20'}
      flex items-center gap-2
      ${isToggling ? 'opacity-70 pointer-events-none' : ''}
    `}
    aria-label={isSaved ? "Remove from Watch Later" : "Add to Watch Later"}
  >
    {#if isSaved}
      <div in:scale={{ duration: 200 }}>
        <Check class={simple ? 'w-4 h-4' : 'w-5 h-5'} />
      </div>
      {#if !simple}
        <span in:fade={{ duration: 150, delay: 50 }}>Saved</span>
      {/if}
    {:else}
      <div in:scale={{ duration: 200 }}>
        <Clock class={simple ? 'w-4 h-4' : 'w-5 h-5'} />
      </div>
      {#if !simple}
        <span in:fade={{ duration: 150, delay: 50 }}>Watch Later</span>
      {/if}
    {/if}
  </button>
  
  {#if showTooltip}
    <div 
      transition:fade={{ duration: 200 }}
      class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-50"
    >
      <div class="text-center">
        <p class="mb-2">Sign in to save items to your Watch Later list</p>
        <button 
          on:click={goToLogin}
          class="bg-red-500 text-white text-xs px-3 py-1 rounded hover:bg-red-600 transition-colors"
        >
          Sign in
        </button>
      </div>
      <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
    </div>
  {/if}
</div> 