<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		Loader2,
		AlertCircle,
		Mail,
		Lock,
		Eye,
		EyeOff,
		ArrowRight,
		CheckCircle
	} from 'lucide-svelte';

	let email = '';
	let password = '';
	let confirmPassword = '';
	let error = '';
	let loading = false;
	let success = '';
	let passwordVisible = false;
	let confirmPasswordVisible = false;

	$: passwordsMatch = !confirmPassword || password === confirmPassword;
	$: canSubmit = email && password && confirmPassword && passwordsMatch && !loading;

	function togglePasswordVisibility() {
		passwordVisible = !passwordVisible;
	}

	function toggleConfirmPasswordVisibility() {
		confirmPasswordVisible = !confirmPasswordVisible;
	}

	async function handleRegister() {
		if (!passwordsMatch) {
			error = 'Passwords do not match';
			return;
		}

		error = '';
		success = '';
		loading = true;
		try {
			const res = await fetch('/api/auth', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password, action: 'register' })
			});
			const data = await res.json();
			if (!res.ok) {
				error = data.error || data.description || 'Registration failed';
			} else {
				success = data.message || 'Registration successful!';
				// Clear the form
				email = '';
				password = '';
				confirmPassword = '';
				// Redirect after a short delay
				setTimeout(() => {
					goto('/login');
				}, 3000);
			}
		} catch (e) {
			error = 'Network error. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Create Account | Watsch</title>
	<meta name="description" content="Create a new Watsch account to discover great movies." />
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
			<h1 class="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Create Account</h1>
			<p class="mt-2 text-gray-600 dark:text-gray-400">Join and discover great movies</p>
		</div>

		<!-- Registration form -->
		<div
			class="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8"
		>
			<form on:submit|preventDefault={handleRegister} class="space-y-6">
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
						<div>
							<p class="text-green-800 dark:text-green-300">{success}</p>
							<p class="text-green-600 dark:text-green-400 text-xs mt-1">Redirecting to login...</p>
						</div>
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

				<div class="space-y-2">
					<label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>Password</label
					>
					<div class="relative">
						<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Lock class="h-5 w-5 text-gray-400" />
						</div>
						{#if passwordVisible}
							<input
								id="password"
								type="text"
								bind:value={password}
								required
								placeholder="••••••••"
								class="block w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-150"
							/>
						{:else}
							<input
								id="password"
								type="password"
								bind:value={password}
								required
								placeholder="••••••••"
								class="block w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-150"
							/>
						{/if}
						<button
							type="button"
							class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
							on:click={togglePasswordVisibility}
						>
							{#if passwordVisible}
								<EyeOff class="h-5 w-5" />
							{:else}
								<Eye class="h-5 w-5" />
							{/if}
						</button>
					</div>
				</div>

				<div class="space-y-2">
					<label
						for="confirm-password"
						class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>Confirm Password</label
					>
					<div class="relative">
						<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Lock class="h-5 w-5 text-gray-400" />
						</div>
						{#if confirmPasswordVisible}
							<input
								id="confirm-password"
								type="text"
								bind:value={confirmPassword}
								required
								placeholder="••••••••"
								class={`block w-full pl-10 pr-10 py-3 rounded-lg border ${
									!passwordsMatch && confirmPassword
										? 'border-red-500 dark:border-red-500'
										: 'border-gray-300 dark:border-gray-700'
								} bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-150`}
							/>
						{:else}
							<input
								id="confirm-password"
								type="password"
								bind:value={confirmPassword}
								required
								placeholder="••••••••"
								class={`block w-full pl-10 pr-10 py-3 rounded-lg border ${
									!passwordsMatch && confirmPassword
										? 'border-red-500 dark:border-red-500'
										: 'border-gray-300 dark:border-gray-700'
								} bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition duration-150`}
							/>
						{/if}
						<button
							type="button"
							class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
							on:click={toggleConfirmPasswordVisibility}
						>
							{#if confirmPasswordVisible}
								<EyeOff class="h-5 w-5" />
							{:else}
								<Eye class="h-5 w-5" />
							{/if}
						</button>
					</div>
					{#if confirmPassword && !passwordsMatch}
						<p class="text-sm text-red-600 dark:text-red-400 mt-1">Passwords don't match</p>
					{/if}
				</div>

				<button
					type="submit"
					disabled={!canSubmit}
					class="w-full py-3 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
				>
					{#if loading}
						<Loader2 class="h-5 w-5 animate-spin" />
						<span>Creating account...</span>
					{:else}
						<span>Create Account</span>
						<ArrowRight class="h-5 w-5" />
					{/if}
				</button>
			</form>

			<div class="mt-6 text-center">
				<p class="text-sm text-gray-600 dark:text-gray-400">
					Already have an account?
					<a href="/login" class="font-medium text-red-600 hover:text-red-500">Sign in</a>
				</p>
			</div>
		</div>
	</div>
</div>
