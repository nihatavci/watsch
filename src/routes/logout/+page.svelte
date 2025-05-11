<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { isAuthenticated } from '$lib/stores/auth';

	onMount(() => {
		// Clear the auth token
		localStorage.removeItem('auth_token');
		// Update the auth state
		isAuthenticated.set(false);
		// Redirect to home page
		goto('/');
	});
</script>

<div>Logging out...</div>
