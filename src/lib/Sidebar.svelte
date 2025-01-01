<script lang="ts">
    import { fade, slide } from 'svelte/transition';
    import { library } from '../stores/library';
    
    export let isOpen: boolean = false;
    
    function removeFromSaved(id: string) {
        library.removeFromSaved(id);
    }
    
    function clearHistory() {
        library.clearHistory();
    }
</script>

<div
    class={`fixed right-0 top-0 h-full w-80 glassmorphism border-l border-white/[0.05] transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
    }`}
    style="z-index: 1000;"
>
    <div class="p-6 h-full flex flex-col">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                Your Library
            </h2>
            <button
                on:click={() => (isOpen = false)}
                class="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
            >
                <svg class="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <!-- Saved to Watch -->
        <div class="mb-6">
            <h3 class="text-sm uppercase text-white/50 mb-3">Saved to Watch</h3>
            <div class="space-y-3">
                {#if $library.savedItems.length === 0}
                    <p class="text-sm text-white/30">No saved items yet</p>
                {:else}
                    {#each $library.savedItems as item (item.id)}
                        <div
                            class="flex items-center p-3 bg-white/[0.02] rounded-lg border border-white/[0.05]"
                            transition:slide
                        >
                            <img src={item.poster} alt={item.title} class="w-12 h-16 object-cover rounded" />
                            <div class="ml-3 flex-1">
                                <h4 class="text-sm font-medium text-white/90">{item.title}</h4>
                                <p class="text-xs text-white/50">{item.year}</p>
                                <div class="flex gap-1 mt-1">
                                    {#each item.platforms as platform}
                                        <span class="text-xs px-1.5 py-0.5 bg-white/[0.05] rounded">
                                            {platform}
                                        </span>
                                    {/each}
                                </div>
                            </div>
                            <button
                                on:click={() => removeFromSaved(item.id)}
                                class="p-1.5 hover:bg-white/[0.05] rounded-lg transition-colors"
                            >
                                <svg class="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    {/each}
                {/if}
            </div>
        </div>

        <!-- Search History -->
        <div class="flex-1">
            <div class="flex justify-between items-center mb-3">
                <h3 class="text-sm uppercase text-white/50">Search History</h3>
                {#if $library.searchHistory.length > 0}
                    <button
                        on:click={clearHistory}
                        class="text-xs text-white/30 hover:text-white/50 transition-colors"
                    >
                        Clear All
                    </button>
                {/if}
            </div>
            <div class="space-y-2">
                {#if $library.searchHistory.length === 0}
                    <p class="text-sm text-white/30">No search history</p>
                {:else}
                    {#each $library.searchHistory as search (search.id)}
                        <div
                            class="p-3 bg-white/[0.02] rounded-lg border border-white/[0.05]"
                            transition:slide
                        >
                            <p class="text-sm text-white/70">{search.query}</p>
                            <p class="text-xs text-white/30 mt-1">
                                {new Date(search.timestamp).toLocaleDateString()}
                            </p>
                        </div>
                    {/each}
                {/if}
            </div>
        </div>
    </div>
</div>

<style>
    /* Add any additional styles here */
</style> 