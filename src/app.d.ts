/// <reference types="svelte" />
declare module '*.svelte' {
	import type { ComponentType } from 'svelte';
	const component: ComponentType;
	export default component;
}

declare namespace svelteHTML {
	interface HTMLAttributes<T> {
		[key: string]: any;
	}
}
