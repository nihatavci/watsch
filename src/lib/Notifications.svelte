<script lang="ts">
    import { notificationStore } from './notifications';
    import { fly } from 'svelte/transition';
</script>

<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
    {#each $notificationStore as notification (notification.id)}
        <div
            class="px-4 py-2 rounded-lg shadow-lg text-sm font-medium"
            class:bg-blue-500={notification.type === 'info'}
            class:bg-green-500={notification.type === 'success'}
            class:bg-red-500={notification.type === 'error'}
            class:text-white={true}
            transition:fly={{ y: 20, duration: 300 }}
        >
            {notification.message}
        </div>
    {/each}
</div> 