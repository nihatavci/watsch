<script lang="ts">
	export const loading = true;
	export const incomingStream = false;
</script>

<div class="rounded-2xl p-6 w-full h-64 flex flex-col gap-4 animate-pulse bg-gradient-to-br from-[#232526] to-[#414345]">
	<div class="h-32 rounded-xl bg-gradient-to-r from-[#232526] via-[#414345] to-[#232526] opacity-80"></div>
	<div class="h-6 rounded bg-gradient-to-r from-[#414345] via-[#232526] to-[#414345] w-3/4 opacity-80"></div>
	<div class="h-4 rounded bg-gradient-to-r from-[#414345] via-[#232526] to-[#414345] w-1/2 opacity-80"></div>
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
