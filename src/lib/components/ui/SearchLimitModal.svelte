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
      class="w-full max-w-md bg-card border-2 border-border shadow-[8px_8px_0px_0px_hsl(var(--border))] overflow-hidden"
      on:click|stopPropagation
      role="dialog"
      tabindex="-1"
      aria-modal="true"
      aria-labelledby="search-limit-modal-title"
      transition:fly={{ y: 20, duration: 300 }}
    >
      <!-- Header -->
      <div class="p-5 bg-destructive text-destructive-foreground flex items-center justify-between border-b-2 border-border">
        <div class="flex items-center gap-3">
          <AlertTriangle class="w-5 h-5" />
          <span class="font-bold text-lg" id="search-limit-modal-title">Search Limit Reached</span>
        </div>
        <button 
          on:click={onClose}
          class="p-2 hover:bg-white/20 transition-colors border-2 border-transparent hover:border-destructive-foreground"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
      
      <!-- Content -->
      <div class="p-5 space-y-4">
        <p class="text-foreground">
          You've reached your daily search limit as a guest user. 
          Sign in to unlock unlimited searches and more features!
        </p>
        
        <div class="bg-muted border-2 border-border shadow-[4px_4px_0px_0px_hsl(var(--border))] p-4 space-y-3">
          <h3 class="font-bold text-foreground flex items-center gap-2">
            <Unlock class="w-4 h-4 text-destructive" />
            <span>Sign in to unlock:</span>
          </h3>
          
          <ul class="space-y-2 text-sm">
            <li class="flex items-start gap-3">
              <div class="w-5 h-5 bg-destructive text-destructive-foreground flex items-center justify-center mt-0.5 flex-shrink-0 border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] font-bold">✓</div>
              <span class="text-foreground">Unlimited movie & show searches</span>
            </li>
            <li class="flex items-start gap-3">
              <div class="w-5 h-5 bg-destructive text-destructive-foreground flex items-center justify-center mt-0.5 flex-shrink-0 border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] font-bold">✓</div>
              <span class="text-foreground">Save movies & shows to watch later</span>
            </li>
            <li class="flex items-start gap-3">
              <div class="w-5 h-5 bg-destructive text-destructive-foreground flex items-center justify-center mt-0.5 flex-shrink-0 border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] font-bold">✓</div>
              <span class="text-foreground">Personalized recommendations</span>
            </li>
          </ul>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="p-5 bg-muted/50 border-t-2 border-border flex items-center justify-between gap-3">
        <button 
          on:click={onClose}
          class="px-4 py-2 bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[4px_4px_0px_0px_hsl(var(--border))] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-100 font-medium"
        >
          Continue as guest
        </button>
        
        <a 
          href="/login" 
          class="px-5 py-2 bg-destructive text-destructive-foreground border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[4px_4px_0px_0px_hsl(var(--border))] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-100 font-bold flex items-center gap-2"
        >
          <Lock class="w-4 h-4" />
          <span>Sign in</span>
        </a>
      </div>
    </div>
  </div>
{/if} 