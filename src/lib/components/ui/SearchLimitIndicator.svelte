<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { fade, fly } from 'svelte/transition';
  import { Info, Unlock } from 'lucide-svelte';

  let searchLimit = {
    isLimited: false,
    searchesUsed: 0,
    searchesRemaining: 2,
    canSearch: true
  };
  
  let loading = true;
  let visible = false;
  
  // Fetch current search limit status
  async function fetchSearchLimitStatus() {
    try {
      loading = true;
      
      // Get the auth token from localStorage for authenticated requests
      const authToken = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {};
      
      // Add auth token if available
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch('/api/search-limit', { headers });
      
      if (response.ok) {
        const data = await response.json();
        searchLimit = data;
        console.log('Search limit status:', data);
      }
    } catch (error) {
      console.error('Error fetching search limit:', error);
    } finally {
      loading = false;
    }
  }
  
  onMount(() => {
    // Only show for unauthenticated users
    const unsubscribe = authStore.subscribe((auth) => {
      visible = !auth.isAuthenticated;
      
      // Always fetch the latest limit status when auth state changes
      fetchSearchLimitStatus();
    });
    
    return unsubscribe;
  });
</script>

{#if visible && !loading}
  <div 
    in:fade={{ duration: 200 }}
    class="py-2 px-3 rounded-md bg-red-500/10 border border-red-500/20 text-xs flex items-center justify-between gap-2 mb-4"
  >
    <div class="flex items-center gap-2">
      <Info class="w-4 h-4 text-red-500" />
      <span class="text-red-500">
        {#if searchLimit.searchesRemaining > 0}
          <span class="font-medium">{searchLimit.searchesRemaining} {searchLimit.searchesRemaining === 1 ? 'search' : 'searches'}</span> remaining today
        {:else}
          <span class="font-medium">Search limit reached</span> for today
        {/if}
      </span>
    </div>
    <a
      href="/login"
      class="flex items-center gap-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-md px-2 py-1 transition-colors"
    >
      <Unlock class="w-3 h-3" />
      <span>Sign in</span>
    </a>
  </div>
{/if} 