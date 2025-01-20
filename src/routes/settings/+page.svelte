<script lang="ts">
	import { Moon, Sun, Sparkles, ChevronRight } from 'lucide-svelte';
	import { theme } from '$lib/stores/theme';
	import { fly } from 'svelte/transition';

	function toggleTheme() {
		// Vibrate on theme change for haptic feedback
		if (window.navigator.vibrate) {
			window.navigator.vibrate(50);
		}
		$theme = $theme === 'dark' ? 'light' : 'dark';
	}

	const settings = [
		{
			id: 'theme',
			title: 'Theme',
			description: 'Choose your preferred theme',
			action: toggleTheme
		}
	];

	// Make icon reactive
	$: themeIcon = $theme === 'dark' ? Sun : Moon;
</script>

<div class="relative min-h-screen bg-[#0A0118]">
	<!-- Gradient background -->
	<div class="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(220,38,38,0.15),rgba(255,255,255,0))]" />

	<!-- RetroGrid -->
	<div class="pointer-events-none fixed inset-0 overflow-hidden [perspective:200px]">
		<div class="absolute inset-0 [transform:rotateX(65deg)]">
			<div class="animate-grid [background-image:linear-gradient(to_right,rgba(220,38,38,0.1)_1px,transparent_0),linear-gradient(to_bottom,rgba(220,38,38,0.1)_1px,transparent_0)] [background-repeat:repeat] [background-size:50px_50px] [height:300vh] [inset:0%_0px] [margin-left:-200%] [transform-origin:100%_0_0] [width:600vw]" />
		</div>
		<div class="absolute inset-0 bg-gradient-to-t from-[#0A0118] to-transparent to-90%" />
	</div>

	<!-- Content -->
	<div class="relative z-10 max-w-4xl mx-auto px-4 py-6">
		<!-- Mobile-optimized header -->
		<div class="space-y-3 sm:space-y-4">
			<div class="flex items-center gap-2 text-red-500">
				<Sparkles class="w-5 h-5" />
				<span class="text-sm font-medium">Customize Your Experience</span>
			</div>
			<h1 class="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-white to-red-500 animate-gradient">
				Settings
			</h1>
		</div>

		<div class="mt-6 space-y-3">
			{#each settings as setting}
				<button
					class="w-full group active:scale-[0.99] transition-all"
					on:click={setting.action}
					in:fly={{ y: 20, duration: 200 }}
				>
					<div class="flex items-center gap-4 p-4 rounded-xl bg-black/40 border border-red-500/20 backdrop-blur-sm">
						<div class="p-2 rounded-lg bg-red-500/10 text-red-500">
							<svelte:component this={themeIcon} class="w-5 h-5" />
						</div>
						<div class="flex-1 text-left">
							<h3 class="text-base font-medium text-white">{setting.title}</h3>
							<p class="text-sm text-white/60">{setting.description}</p>
						</div>
						<ChevronRight class="w-4 h-4 text-white/40 group-active:translate-x-1 transition-transform" />
					</div>
				</button>
			{/each}
		</div>

		<!-- Mobile helper text -->
		<p class="text-xs text-white/40 text-center mt-4 sm:hidden">
			Tap to change settings • Changes are saved automatically
		</p>
	</div>
</div>

<style>
	@keyframes gradient {
		0% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
		100% { background-position: 0% 50%; }
	}
	.animate-gradient {
		background-size: 200% auto;
		animation: gradient 8s linear infinite;
	}
</style> 