<script lang="ts">
	import { getContext } from 'svelte';
	import { cn } from '$lib/utils';
	import type { Writable } from 'svelte/store';
	import { page } from '$app/stores';

	interface SidebarContextProps {
		open: Writable<boolean>;
		currentPath: string;
	}

	export let link: {
		label: string;
		href: string;
		icon: any;
	};

	$: isActive = $page.url.pathname === link.href;
</script>

<a
	href={link.href}
	class={cn(
		'flex items-center gap-3 px-3 py-2 rounded-lg transition-all relative group',
		isActive ? 'text-white bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/5'
	)}
>
	<svelte:component
		this={link.icon}
		class={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-white' : '')}
	/>
	<span
		class="text-sm whitespace-nowrap md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
	>
		{link.label}
	</span>
</a>
