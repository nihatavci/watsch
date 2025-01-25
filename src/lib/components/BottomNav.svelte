<script lang="ts">
	import { Film, Heart, Home, Search, User } from 'lucide-svelte';
	import { sidebar } from '../../stores/sidebar';
	import { page } from '$app/stores';

	$: currentPath = $page.url.pathname;
</script>

<div class="fixed inset-x-0 bottom-0 z-50 bg-[#0f0f0f] border-t border-white/10 md:hidden">
	<div class="grid grid-cols-5 gap-4 p-2">
		<a
			href="/"
			class="flex flex-col items-center justify-center p-2 text-white/50 hover:text-white transition-colors"
			class:active={currentPath === '/'}
		>
			<Home class="w-5 h-5" />
			<span class="text-xs mt-1">Home</span>
		</a>
		<a
			href="/shorts"
			class="flex flex-col items-center justify-center p-2 text-white/50 hover:text-white transition-colors"
			class:active={currentPath === '/shorts'}
		>
			<Film class="w-5 h-5" />
			<span class="text-xs mt-1">Shorts</span>
		</a>
		<button
			class="flex flex-col items-center justify-center p-2 text-white/50 hover:text-white transition-colors"
			on:click={() => sidebar.set({ isOpen: true, view: 'library' })}
		>
			<Heart class="w-5 h-5" />
			<span class="text-xs mt-1">Library</span>
		</button>
		<a
			href="/recommendations"
			class="flex flex-col items-center justify-center p-2 text-white/50 hover:text-white transition-colors"
			class:active={currentPath === '/recommendations'}
		>
			<Search class="w-5 h-5" />
			<span class="text-xs mt-1">Search</span>
		</a>
		<a
			href="/settings"
			class="flex flex-col items-center justify-center p-2 text-white/50 hover:text-white transition-colors"
			class:active={currentPath === '/settings'}
		>
			<User class="w-5 h-5" />
			<span class="text-xs mt-1">Profile</span>
		</a>
	</div>
</div>

<style>
	.active {
		@apply text-[#E50914];
	}
</style>
