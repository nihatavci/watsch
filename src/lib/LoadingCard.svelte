<script lang="ts">
	export let loading = true;
	export const incomingStream = false;
</script>

<div class="relative flex flex-col md:flex-row bg-neutral-800/70 shadow-md p-6 rounded-xl animate-pulse">
	<div class="w-full h-[250px] bg-neutral-700/50 rounded-lg" />
</div>

<style>
	.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 0.05;
		}
		50% {
			opacity: 0.1;
		}
	}
</style>
