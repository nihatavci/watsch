<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';
	import { Bookmark, X } from 'lucide-svelte';

	export let message: string;
	export let variant: 'success' | 'error' | 'info' = 'success';
	export let duration = 3000;
	export let showIcon = true;

	const dispatch = createEventDispatcher();

	let timer: NodeJS.Timeout;

	function startTimer() {
		if (duration > 0) {
			timer = setTimeout(() => {
				dispatch('close');
			}, duration);
		}
	}

	function cancelTimer() {
		if (timer) clearTimeout(timer);
	}

	$: if (message) {
		startTimer();
	}
</script>

<div
	class="fixed bottom-20 right-5 md:bottom-5 z-50"
	on:mouseenter={cancelTimer}
	on:mouseleave={startTimer}
	in:fly={{ y: 20, duration: 300 }}
	out:fade={{ duration: 200 }}
>
	<div
		class="max-w-xs bg-black/90 text-white rounded-lg shadow-lg border border-red-500/20 overflow-hidden flex items-center"
		style="min-width: auto; max-width: 240px;"
	>
		{#if showIcon}
			<div class="p-2 bg-red-600">
				<Bookmark class="w-4 h-4 text-white" />
			</div>
		{/if}
		<div class="py-2 px-3 flex-1">
			<p class="text-xs font-medium">{message}</p>
		</div>
		<button class="p-2 text-white/60 hover:text-white" on:click={() => dispatch('close')}>
			<X class="w-3 h-3" />
		</button>
	</div>
</div>

<style>
	:global(.toast-enter) {
		transform: translateY(20px);
		opacity: 0;
	}
	:global(.toast-enter-active) {
		transform: translateY(0);
		opacity: 1;
		transition: all 300ms ease-out;
	}
	:global(.toast-exit) {
		opacity: 1;
	}
	:global(.toast-exit-active) {
		opacity: 0;
		transition: opacity 200ms ease-in;
	}
</style>
