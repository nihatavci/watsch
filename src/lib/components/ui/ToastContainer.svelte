<script lang="ts">
	import { onMount } from 'svelte';
	import { toastNotification } from '../../../stores/notifications';
	import Toast from './Toast.svelte';

	let showToast = false;
	let message = '';
	let variant: 'success' | 'error' | 'info' = 'success';
	let duration = 3000;

	onMount(() => {
		const unsubscribe = toastNotification.subscribe((notification) => {
			if (notification.show) {
				showToast = true;
				message = notification.message;
				variant = notification.variant as 'success' | 'error' | 'info';
				duration = notification.duration;
			} else {
				showToast = false;
			}
		});

		return unsubscribe;
	});

	function handleClose() {
		toastNotification.set({ show: false, message: '', variant: 'success', duration: 3000 });
	}
</script>

{#if showToast}
	<Toast {message} {variant} {duration} on:close={handleClose} />
{/if}
