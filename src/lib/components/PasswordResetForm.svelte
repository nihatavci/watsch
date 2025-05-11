<script lang="ts">
	import { goto } from '$app/navigation';
	import { Loader2, AlertCircle, Mail, CheckCircle, ArrowRight } from 'lucide-svelte';

	let email = '';
	let error = '';
	let loading = false;
	let success = '';

	async function handlePasswordReset() {
		error = '';
		success = '';
		loading = true;
		try {
			const res = await fetch('/api/auth', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});
			const data = await res.json();
			if (!res.ok) {
				error = data.error || 'Password reset failed';
			} else {
				success = 'Password reset email sent! Please check your inbox.';
			}
		} catch (e) {
			error = 'Network error. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Reset Password | Watsch</title>
	<meta name="description" content="Reset your Watsch account password." />
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-black">
	<div class="w-full max-w-md">
		<!-- Logo and title -->
		<div class="text-center mb-8">
			<div class="flex justify-center">
				<a href="/" class="text-2xl font-bold inline-flex items-center">
					<span class="text-gray-900 dark:text-white">Wat</span>
					<span class="text-red-500">sch</span>
				</a>
			</div>
			<h1 class="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Reset Password</h1>
			<p class="mt-2 text-gray-600 dark:text-gray-400">
				We'll send you a link to reset your password
			</p>
		</div>

		<!-- Reset form -->
		<div
			class="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8"
		>
			<form on:submit|preventDefault={handlePasswordReset} class="space-y-6">
				{#if error}
					<div
						class="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-start gap-3 border border-red-100 dark:border-red-800/50 text-sm"
					>
						<AlertCircle class="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
						<p class="text-red-800 dark:text-red-300">{error}</p>
					</div>
				{/if}

				{#if success}
					<div
						class="p-4 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-start gap-3 border border-green-100 dark:border-green-800/50 text-sm"
					>
						<CheckCircle class="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
						<p class="text-green-800 dark:text-green-300">{success}</p>
					</div>
				{/if}

				<div class="space-y-2">
					<label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>Email address</label
					>
					<div class="relative">
						<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Mail class="h-5 w-5 text-gray-400" />
						</div>
						<input
							id="email"
							type="email"
							bind:value={email}
							required
							placeholder="you@example.com"
							class="block w-full pl-10 pr-3 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-150"
						/>
					</div>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="w-full py-3 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
				>
					{#if loading}
						<Loader2 class="h-5 w-5 animate-spin" />
						<span>Sending reset link...</span>
					{:else}
						<span>Send Reset Link</span>
						<ArrowRight class="h-5 w-5" />
					{/if}
				</button>
			</form>

			<div class="mt-6 text-center">
				<p class="text-sm text-gray-600 dark:text-gray-400">
					Remember your password?
					<a href="/login" class="font-medium text-red-600 hover:text-red-500">Back to login</a>
				</p>
			</div>
		</div>
	</div>
</div>
