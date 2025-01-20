<script lang="ts">
	import { HelpCircle, Users, Film, Star, Lock, Share2 } from 'lucide-svelte';

	const sections = [
		{
			title: 'Getting Started',
			icon: HelpCircle,
			content: `Movie Night is a fun way to watch movies with friends, even when you're not in the same room. Create a room, share the code, and start watching together!`
		},
		{
			title: 'Creating a Room',
			icon: Users,
			content: `Click "Start the Party!" to create a new room. You'll get a unique room code that you can share with your friends.`
		},
		{
			title: 'Joining a Room',
			icon: Film,
			content: `Have a room code? Just enter it in the "Got a room code?" field and click "Join In!" to join your friends.`
		},
		{
			title: 'Rating Movies',
			icon: Star,
			content: `Once in a room, you can rate movies and see what your friends think. Your ratings help us recommend better movies for the group.`
		},
		{
			title: 'Privacy',
			icon: Lock,
			content: `Your movie preferences are only shared with the friends you choose to watch with. We never share your data with third parties.`
		},
		{
			title: 'Sharing',
			icon: Share2,
			content: `Share your room code with friends via any messaging app. Anyone with the code can join your movie night!`
		}
	];
</script>

<svelte:head>
	<title>Help | Watsch</title>
</svelte:head>

<div class="relative min-h-screen bg-white dark:bg-[#0A0118] overflow-hidden">
	<!-- Gradient background -->
	<div
		class="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(220,38,38,0.05),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(220,38,38,0.15),rgba(255,255,255,0))]"
	/>

	<!-- RetroGrid -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden [perspective:200px]">
		<div class="absolute inset-0 [transform:rotateX(65deg)]">
			<div
				class="animate-grid [background-image:linear-gradient(to_right,rgba(220,38,38,0.05)_1px,transparent_0),linear-gradient(to_bottom,rgba(220,38,38,0.05)_1px,transparent_0)] dark:[background-image:linear-gradient(to_right,rgba(220,38,38,0.1)_1px,transparent_0),linear-gradient(to_bottom,rgba(220,38,38,0.1)_1px,transparent_0)] [background-repeat:repeat] [background-size:50px_50px] [height:300vh] [inset:0%_0px] [margin-left:-200%] [transform-origin:100%_0_0] [width:600vw]"
			/>
		</div>
		<div
			class="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0A0118] to-transparent to-90%"
		/>
	</div>

	<!-- Content -->
	<div class="relative z-10 min-h-screen flex flex-col">
		<main class="flex-1 w-full">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
				<!-- Header -->
				<div class="text-center space-y-4 mb-12 sm:mb-20">
					<div
						class="inline-flex items-center px-4 py-1.5 rounded-full text-sm text-gray-600 dark:text-white/60 border border-red-500/10 dark:border-red-500/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm mb-6"
					>
						<HelpCircle class="w-4 h-4 mr-2 text-red-500" />
						Documentation
					</div>
					<h1
						class="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white tracking-tight"
					>
						How Movie Night Works
					</h1>
					<p class="text-lg sm:text-xl text-gray-600 dark:text-white/60 max-w-2xl mx-auto">
						Everything you need to know about watching movies with friends on Watsch.
					</p>
				</div>

				<!-- Documentation Grid -->
				<div
					class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-none mx-auto"
				>
					{#each sections as section}
						<div
							class="group relative p-6 sm:p-8 rounded-2xl border border-red-500/10 dark:border-red-500/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-black/60 transition-all duration-200 flex flex-col"
						>
							<div class="flex items-start gap-4 h-full">
								<div
									class="flex-shrink-0 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 group-hover:bg-red-100 dark:group-hover:bg-red-500/20 transition-colors"
								>
									<svelte:component this={section.icon} class="w-6 h-6" />
								</div>
								<div class="min-w-0 flex-1">
									<h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-3">
										{section.title}
									</h3>
									<p class="text-base text-gray-600 dark:text-white/60 leading-relaxed">
										{section.content}
									</p>
								</div>
							</div>
						</div>
					{/each}
				</div>

				<!-- Footer -->
				<div class="mt-16 sm:mt-24 text-center">
					<div
						class="inline-flex items-center gap-2 px-6 py-3 rounded-full text-gray-600 dark:text-white/80 border border-red-500/10 dark:border-red-500/20 bg-white/80 dark:bg-black/40 backdrop-blur-sm hover:text-gray-900 dark:hover:text-white hover:bg-white/90 dark:hover:bg-black/60 transition-all duration-200"
					>
						<span>Still have questions?</span>
						<a href="/contact" class="text-red-500 hover:text-red-600 dark:hover:text-red-400"
							>Contact us →</a
						>
					</div>
				</div>
			</div>
		</main>
	</div>
</div>

<style>
	@keyframes grid {
		to {
			transform: translateY(-50%);
		}
	}

	:global(.animate-grid) {
		animation: grid 30s linear infinite;
	}
</style> 