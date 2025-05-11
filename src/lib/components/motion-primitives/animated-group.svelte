<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { cn } from '$lib/utils';

	// Define types for our variants
	type VariantState = {
		opacity?: number;
		y?: number;
		filter?: string;
	};

	type TransitionConfig = {
		type?: string;
		stiffness?: number;
		damping?: number;
		staggerChildren?: number;
		delayChildren?: number;
	};

	type Variant = {
		hidden: VariantState;
		visible: VariantState & {
			transition?: TransitionConfig;
		};
	};

	// Props
	export let variants: {
		container: Variant;
		item: Variant;
	} = {
		container: {
			hidden: { opacity: 0 },
			visible: {
				opacity: 1,
				transition: {
					staggerChildren: 0.05,
					delayChildren: 0.3
				}
			}
		},
		item: {
			hidden: { opacity: 0, y: 20 },
			visible: {
				opacity: 1,
				y: 0,
				transition: {
					type: 'spring',
					stiffness: 300,
					damping: 24
				}
			}
		}
	};

	let className = '';
	export { className as class };

	// Internal state
	let containerRef: HTMLElement;
	let childElements: HTMLElement[] = [];
	let mounted = false;

	onMount(async () => {
		if (!containerRef) return;

		// Wait for children to render
		await tick();

		// Find all direct children that don't have data-animate="false"
		childElements = Array.from(containerRef.children).filter(
			(child) => child.getAttribute('data-animate') !== 'false'
		) as HTMLElement[];

		// Set initial styles based on container's hidden state
		if (variants.container.hidden.opacity !== undefined) {
			containerRef.style.opacity = variants.container.hidden.opacity.toString();
		}

		// Set initial styles for children based on item's hidden state
		childElements.forEach((el) => {
			if (variants.item.hidden.opacity !== undefined) {
				el.style.opacity = variants.item.hidden.opacity.toString();
			}
			if (variants.item.hidden.y !== undefined) {
				el.style.transform = `translateY(${variants.item.hidden.y}px)`;
			}
			if (variants.item.hidden.filter !== undefined) {
				el.style.filter = variants.item.hidden.filter;
			}
		});

		// Animate the container
		setTimeout(() => {
			if (variants.container.visible.opacity !== undefined) {
				containerRef.style.transition = 'opacity 0.5s ease';
				containerRef.style.opacity = variants.container.visible.opacity.toString();
			}

			// Animate the children with staggering
			childElements.forEach((el, i) => {
				const delay =
					(variants.container.visible.transition?.delayChildren || 0) +
					i * (variants.container.visible.transition?.staggerChildren || 0);

				setTimeout(() => {
					// Apply transitions
					let transitionString = '';

					if (variants.item.visible.opacity !== undefined) {
						transitionString += 'opacity 0.5s ease, ';
					}
					if (variants.item.visible.y !== undefined) {
						transitionString += 'transform 0.5s ease, ';
					}
					if (variants.item.visible.filter !== undefined) {
						transitionString += 'filter 0.5s ease, ';
					}

					if (transitionString) {
						el.style.transition = transitionString.slice(0, -2); // Remove trailing comma and space
					}

					// Apply visible state properties
					if (variants.item.visible.opacity !== undefined) {
						el.style.opacity = variants.item.visible.opacity.toString();
					}
					if (variants.item.visible.y !== undefined) {
						el.style.transform = `translateY(${variants.item.visible.y}px)`;
					}
					if (variants.item.visible.filter !== undefined) {
						el.style.filter = variants.item.visible.filter;
					}
				}, delay * 1000);
			});
		}, 100);

		mounted = true;
	});
</script>

<div class={cn(className)} bind:this={containerRef}>
	<slot />
</div>
