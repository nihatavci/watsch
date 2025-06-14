<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { X, AlertTriangle, Unlock, Lock } from 'lucide-svelte';
  
  export let open = false;
  export let onClose = () => {};

  function handleBackdropKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      onClose();
    }
  }
</script>

{#if open}
  <div 
    class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    role="button" 
    tabindex="0"
    on:click={onClose}
    on:keydown={handleBackdropKeydown}
    aria-label="Close modal"
    transition:fade={{ duration: 200 }}
  >
    <div 
      class="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden"
      on:click|stopPropagation
      role="dialog"
      tabindex="-1"
      aria-modal="true"
      aria-labelledby="search-limit-modal-title"
      transition:fly={{ y: 20, duration: 300 }}
    >
      <!-- Header -->
      <div class="p-5 bg-red-500 text-white flex items-center justify-between">
        <div class="flex items-center gap-2">
          <AlertTriangle class="w-5 h-5" />
          <span class="font-semibold text-lg" id="search-limit-modal-title">Search Limit Reached</span>
        </div>
        <button 
          on:click={onClose}
          class="p-1 rounded-full hover:bg-white/20 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
      
      <!-- Content -->
      <div class="p-5 space-y-4">
        <p class="text-gray-700 dark:text-gray-300">
          You've reached your daily search limit as a guest user. 
          Sign in to unlock unlimited searches and more features!
        </p>
        
        <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 space-y-3">
          <h3 class="font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Unlock class="w-4 h-4 text-red-500" />
            <span>Sign in to unlock:</span>
          </h3>
          
          <ul class="space-y-2 text-sm">
            <li class="flex items-start gap-2">
              <div class="w-5 h-5 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mt-0.5 flex-shrink-0">✓</div>
              <span class="text-gray-700 dark:text-gray-300">Unlimited movie & show searches</span>
            </li>
            <li class="flex items-start gap-2">
              <div class="w-5 h-5 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mt-0.5 flex-shrink-0">✓</div>
              <span class="text-gray-700 dark:text-gray-300">Save movies & shows to watch later</span>
            </li>
            <li class="flex items-start gap-2">
              <div class="w-5 h-5 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mt-0.5 flex-shrink-0">✓</div>
              <span class="text-gray-700 dark:text-gray-300">Personalized recommendations</span>
            </li>
          </ul>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="p-5 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between gap-3">
        <button 
          on:click={onClose}
          class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          Continue as guest
        </button>
        
        <a 
          href="/login" 
          class="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors flex items-center gap-2"
        >
          <Lock class="w-4 h-4" />
          <span>Sign in</span>
        </a>
      </div>
    </div>
  </div>
{/if} 