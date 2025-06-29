<script lang="ts">
	import { Moon, Sun, Sparkles, ChevronRight, Palette } from 'lucide-svelte';
	import { theme, toggleColorMode } from '$lib/stores/theme';
	import { fly } from 'svelte/transition';

	const settings = [
		{
			id: 'theme',
			title: 'Theme',
			description: 'Switch between light and dark mode',
			action: toggleColorMode
		}
	];

	// Make icon reactive
	$: themeIcon = $theme.colorMode === 'dark' ? Sun : Moon;
	$: themeText = $theme.colorMode === 'dark' ? 'Switch to Light' : 'Switch to Dark';
</script>

<svelte:head>
	<title>Settings | Watsch</title>
	<meta name="description" content="Customize your Watsch experience" />
</svelte:head>

<div class="min-h-screen bg-background pt-4 pb-4">
	<div class="max-w-lg mx-auto py-4 space-y-4">
		<!-- Compact Header -->
		<div class="space-y-2">
			<div class="flex items-center gap-2 text-destructive">
				<Palette class="w-4 h-4" />
				<span class="text-xs font-medium uppercase tracking-wider">Customize</span>
			</div>
			<h1 class="text-2xl font-bold text-foreground">Settings</h1>
		</div>

		<!-- Main Settings Card -->
		<div class="card-base p-4">
			<div class="space-y-3">
				<!-- Theme Toggle -->
				<button
					class="w-full group"
					on:click={toggleColorMode}
					in:fly={{ y: 10, duration: 200 }}
				>
					<div class="flex items-center gap-3 p-3 bg-card border-2 border-border hover:shadow-[4px_4px_0px_0px_hsl(var(--border))] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-100">
						<div class="p-2 bg-destructive text-destructive-foreground border border-border">
							<svelte:component this={themeIcon} class="w-5 h-5" />
						</div>
						<div class="flex-1 text-left">
							<h3 class="text-base font-bold text-foreground">Appearance</h3>
							<p class="text-sm text-muted-foreground">{themeText}</p>
						</div>
						<div class="flex items-center gap-2">
							<span class="text-xs font-medium px-2 py-1 bg-accent/20 text-accent border border-accent/30">
								{$theme.colorMode}
							</span>
							<ChevronRight class="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform duration-100" />
						</div>
					</div>
				</button>
			</div>
		</div>

		<!-- Quick Info -->
		<div class="grid grid-cols-2 gap-3">
			<div class="card-base p-3 text-center">
				<div class="text-lg font-bold text-destructive">AI</div>
				<div class="text-xs text-muted-foreground">Powered</div>
			</div>
			<div class="card-base p-3 text-center">
				<div class="text-lg font-bold text-primary">Auto</div>
				<div class="text-xs text-muted-foreground">Save</div>
			</div>
		</div>

		<!-- Theme Info -->
		<div class="card-base p-4 space-y-3">
			<div class="flex items-center gap-2">
				<Sparkles class="w-4 h-4 text-destructive" />
				<h2 class="font-bold text-foreground">About Themes</h2>
			</div>
			<div class="space-y-2 text-sm">
				<div class="flex justify-between items-center">
					<span class="text-muted-foreground">Light Mode:</span>
					<span class="text-foreground font-medium">Bright & Clean</span>
				</div>
				<div class="flex justify-between items-center">
					<span class="text-muted-foreground">Dark Mode:</span>
					<span class="text-foreground font-medium">Easy on Eyes</span>
				</div>
			</div>
		</div>
	</div>
</div>
