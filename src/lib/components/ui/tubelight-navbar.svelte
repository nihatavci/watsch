<script lang="ts">
  import { page } from '$app/stores'
  import { cn } from '$lib/utils'
  import type { ComponentType } from 'svelte'
  import { browser } from '$app/environment';
  
  export let items: { name: string, url: string, icon: ComponentType }[] = []
  
  let isMobile = false;
  
  function handleResize() {
    if (browser) {
      isMobile = window.innerWidth < 768;
    }
  }
  
  $: if (browser) {
    handleResize();
    window.addEventListener('resize', handleResize);
  }
</script>

<nav class={cn(
  "fixed left-0 right-0 z-50 px-3 py-2 backdrop-blur-md bg-black/20",
  isMobile ? "bottom-0" : "top-0"
)}>
  <div class="mx-auto flex items-center justify-center">
    <ul class="flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2 backdrop-blur-md">
      {#each items as item}
        {@const isActive = $page.url.pathname === item.url}
        <li>
          <a
            href={item.url}
            class={cn(
              'relative flex items-center transition-colors',
              isMobile ? 'h-14 px-5' : 'h-12 px-4 gap-2',
              isActive ? 'text-red-500' : 'text-white/60 hover:text-white'
            )}
          >
            <svelte:component this={item.icon} class={cn(
              isMobile ? "h-5 w-5" : "h-4 w-4"
            )} />
            {#if !isMobile}
              <span class="text-sm font-medium">{item.name}</span>
            {/if}
            {#if isActive}
              <span class={cn(
                "absolute h-px bg-gradient-to-r from-transparent via-red-500 to-transparent",
                isMobile ? "inset-x-0 -top-2" : "inset-x-0 -bottom-2"
              )} />
            {/if}
          </a>
        </li>
      {/each}
    </ul>
  </div>
</nav>

<style>
  nav {
    transition: all 0.3s ease;
  }
</style>
