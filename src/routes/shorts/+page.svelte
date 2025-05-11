<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { Play, Pause } from 'lucide-svelte';

	interface Short {
		id: string;
		videoUrl: string;
		caption: string;
	}

	let currentIndex = 0;
	let shorts: Short[] = [];
	let loading = true;
	let error: string | null = null;
	let currentVideo: HTMLVideoElement;
	let isPlaying = false;
	let container: HTMLElement;
	let videos: HTMLVideoElement[] = [];
	let touchStartY = 0;
	let lastScrollTime = 0;

	onMount(async () => {
		try {
			const response = await fetch('/api/shorts');
			if (!response.ok) throw new Error('Failed to fetch shorts');
			shorts = await response.json();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load shorts';
		} finally {
			loading = false;
		}
	});

	function handleTouchStart(event: TouchEvent) {
		touchStartY = event.touches[0].clientY;
	}

	function handleTouchMove(event: TouchEvent) {
		event.preventDefault();
	}

	function handleTouchEnd(event: TouchEvent) {
		const touchEndY = event.changedTouches[0].clientY;
		const deltaY = touchStartY - touchEndY;
		const now = Date.now();

		// Throttle scrolling to prevent rapid changes
		if (now - lastScrollTime > 300) {
			if (Math.abs(deltaY) > 50) {
				// Minimum swipe distance
				if (deltaY > 0 && currentIndex < shorts.length - 1) {
					scrollToIndex(currentIndex + 1);
				} else if (deltaY < 0 && currentIndex > 0) {
					scrollToIndex(currentIndex - 1);
				}
				lastScrollTime = now;
			}
		}
	}

	function handleWheel(event: WheelEvent) {
		event.preventDefault();
		const now = Date.now();

		if (now - lastScrollTime > 300) {
			if (event.deltaY > 0 && currentIndex < shorts.length - 1) {
				scrollToIndex(currentIndex + 1);
			} else if (event.deltaY < 0 && currentIndex > 0) {
				scrollToIndex(currentIndex - 1);
			}
			lastScrollTime = now;
		}
	}

	async function scrollToIndex(index: number) {
		// Pause current video
		if (videos[currentIndex]) {
			videos[currentIndex].pause();
		}

		currentIndex = index;
		isPlaying = false;

		// Play new video after a short delay
		await new Promise((resolve) => setTimeout(resolve, 100));
		if (videos[currentIndex]) {
			videos[currentIndex].play();
			isPlaying = true;
		}
	}

	function togglePlay(index: number) {
		const video = videos[index];
		if (video) {
			if (video.paused) {
				video.play();
				isPlaying = true;
			} else {
				video.pause();
				isPlaying = false;
			}
		}
	}

	$: if (currentIndex >= 0 && videos[currentIndex]) {
		videos[currentIndex].addEventListener('ended', () => {
			isPlaying = false;
		});
	}
</script>

<div class="fixed inset-0 bg-black flex items-center justify-center">
	<div class="h-full aspect-[9/16] relative bg-black">
		{#if loading}
			<div class="flex items-center justify-center h-full">
				<div
					class="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"
				/>
			</div>
		{:else if error}
			<div class="flex items-center justify-center h-full text-red-500">
				{error}
			</div>
		{:else}
			<div
				bind:this={container}
				class="h-full"
				on:touchstart={handleTouchStart}
				on:touchmove={handleTouchMove}
				on:touchend={handleTouchEnd}
				on:wheel|preventDefault={handleWheel}
			>
				{#each shorts as short, index}
					<div
						class="h-full absolute inset-0 transition-transform duration-300 ease-out"
						style="transform: translateY({(index - currentIndex) * 100}%)"
					>
						<video
							bind:this={videos[index]}
							src={short.videoUrl}
							class="absolute inset-0 w-full h-full object-cover bg-black"
							loop
							playsinline
							on:click={() => togglePlay(index)}
						/>

						<!-- Play/Pause Overlay -->
						<div
							class="absolute inset-0 flex items-center justify-center bg-black/20"
							on:click={() => togglePlay(index)}
						>
							{#if !isPlaying && currentIndex === index}
								<div in:fade={{ duration: 200 }}>
									<Play class="w-16 h-16 text-white/80" />
								</div>
							{/if}
						</div>

						<!-- Description Overlay -->
						<div
							class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent"
						>
							<p class="text-white/90 text-sm">{short.caption}</p>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	/* Hide scrollbar */
	.snap-y::-webkit-scrollbar {
		display: none;
	}
	.snap-y {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
