<script lang="ts">
	import { onMount } from 'svelte';
	import { cn } from '$lib/utils';
	import { sanitizeHTML } from '$lib/utils/sanitize';

	// Props
	export let preset: 'fade-in-blur' | 'fade-in' | 'slide-up' = 'fade-in-blur';
	export let delay = 0;
	export let speedSegment = 0.2;
	export let per: 'character' | 'word' | 'line' = 'character';
	export let as: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' = 'div';

	let className = '';
	export { className as class };

	// Internal state
	let containerRef: HTMLElement;
	let elements: HTMLElement[] = [];
	let mounted = false;

	// Helper to escape text for HTML
	function escapeHTML(str: string): string {
		return str.replace(/[&<>'"]/g, (c) => ({
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			"'": '&#39;',
			'"': '&quot;'
		}[c] || c));
	}

	onMount(() => {
		if (!containerRef) return;

		// Sanitize and extract only text content from the slot
		const raw = containerRef.innerHTML;
		const sanitized = sanitizeHTML(raw);
		// Create a temporary element to extract only text (strip any tags)
		const temp = document.createElement('div');
		temp.innerHTML = sanitized;
		const text = temp.textContent || '';
		let html = '';

		if (per === 'character') {
			html = text
				.split('')
				.map((char) => `<span class="inline-block opacity-0">${char === ' ' ? '&nbsp;' : escapeHTML(char)}</span>`)
				.join('');
		} else if (per === 'word') {
			html = text
				.split(' ')
				.map((word) => `<span class="inline-block opacity-0">${escapeHTML(word)}</span>`)
				.join(' ');
		} else if (per === 'line') {
			html = text
				.split('\n')
				.map((line) => `<span class="block opacity-0">${escapeHTML(line)}</span>`)
				.join('');
		}

		containerRef.innerHTML = html;
		elements = Array.from(containerRef.querySelectorAll('span'));

		// Animate the elements
		const animateElements = () => {
			elements.forEach((el, i) => {
				setTimeout(() => {
					if (preset === 'fade-in-blur') {
						el.style.transition = 'opacity 0.5s ease, filter 0.5s ease, transform 0.5s ease';
						el.style.opacity = '1';
						el.style.filter = 'blur(0)';
						el.style.transform = 'translateY(0)';
					} else if (preset === 'fade-in') {
						el.style.transition = 'opacity 0.5s ease';
						el.style.opacity = '1';
					} else if (preset === 'slide-up') {
						el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
						el.style.opacity = '1';
						el.style.transform = 'translateY(0)';
					}
				}, delay * 1000 + i * speedSegment * 1000);
			});
		};

		// Set initial styles
		elements.forEach((el) => {
			if (preset === 'fade-in-blur') {
				el.style.opacity = '0';
				el.style.filter = 'blur(4px)';
				el.style.transform = 'translateY(10px)';
			} else if (preset === 'fade-in') {
				el.style.opacity = '0';
			} else if (preset === 'slide-up') {
				el.style.opacity = '0';
				el.style.transform = 'translateY(20px)';
			}
		});

		setTimeout(animateElements, 100);
		mounted = true;
	});
</script>

<style>
.text-balance {
  white-space: pre-line;
  word-break: normal;
}
</style>

<svelte:element this={as} class={cn(className)} bind:this={containerRef}>
	<slot />
</svelte:element>
