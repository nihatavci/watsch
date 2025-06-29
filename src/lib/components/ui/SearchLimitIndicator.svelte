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
    class="py-3 px-4 bg-destructive/10 border-2 border-destructive/30 text-xs flex items-center justify-between gap-3 mb-4 shadow-[4px_4px_0px_0px_hsl(var(--border))]"
  >
    <div class="flex items-center gap-3">
      <Info class="w-4 h-4 text-destructive" />
      <span class="text-destructive font-medium">
        {#if searchLimit.searchesRemaining > 0}
          <span class="font-bold">{searchLimit.searchesRemaining} {searchLimit.searchesRemaining === 1 ? 'search' : 'searches'}</span> remaining today
        {:else}
          <span class="font-bold">Search limit reached</span> for today
        {/if}
      </span>
    </div>
    <a
      href="/login"
      class="flex items-center gap-2 text-xs bg-destructive text-destructive-foreground px-3 py-2 transition-all duration-100 border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[4px_4px_0px_0px_hsl(var(--border))] hover:translate-x-[-2px] hover:translate-y-[-2px] font-medium"
    >
      <Unlock class="w-3 h-3" />
      <span>Sign in</span>
    </a>
  </div>
{/if} 