<script lang="ts">
	export const loading = true;
	export const incomingStream = false;
</script>

<div
	class="relative flex flex-col md:flex-row bg-white dark:bg-black shadow-md p-6 rounded-xl animate-pulse"
>
	<div class="w-full h-[250px] bg-gray-100 dark:bg-gray-900/50 rounded-lg" />
</div>

<style>
	.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.05;
		}
		50% {
			opacity: 0.1;
		}
	}
</style>
