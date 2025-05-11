<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { cn } from '$lib/utils';

	export let speed = 30;
	export let speedOnHover = 10;
	export let gap = 40;
	export let direction: 'left' | 'right' = 'left';

	let className = '';
	export { className as class };

	let container: HTMLDivElement;
	let inner: HTMLDivElement;
	let animationRef: number;
	let hovering = false;
	let paused = false;
	let offset = 0;

	function animate() {
		if (!inner || paused) return;

		const currentSpeed = hovering ? speedOnHover : speed;
		const delta = ((direction === 'left' ? -1 : 1) * currentSpeed) / 60;

		offset = (offset + delta) % inner.clientWidth;
		if (offset < 0) offset += inner.clientWidth;

		inner.style.transform = `translateX(${offset}px)`;

		animationRef = requestAnimationFrame(animate);
	}

	onMount(() => {
		if (browser) {
			// Clone children to create infinite effect
			const children = Array.from(inner.children);
			children.forEach((child) => {
				const clone = child.cloneNode(true);
				inner.appendChild(clone);
			});

			// Start animation
			animationRef = requestAnimationFrame(animate);

			return () => {
				cancelAnimationFrame(animationRef);
			};
		}
	});

	function handleMouseEnter() {
		hovering = true;
	}

	function handleMouseLeave() {
		hovering = false;
	}
</script>

<div
	class={cn('relative overflow-hidden', className)}
	bind:this={container}
	on:mouseenter={handleMouseEnter}
	on:mouseleave={handleMouseLeave}
>
	<div
		class="flex w-max animate-marquee items-stretch"
		style={`gap: ${gap}px; animation-play-state: ${paused ? 'paused' : 'running'}`}
		bind:this={inner}
	>
		<slot />
	</div>
</div>

<style>
	@keyframes marquee {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(-50%);
		}
	}

	.animate-marquee {
		animation: marquee 30s linear infinite;
	}
</style>
