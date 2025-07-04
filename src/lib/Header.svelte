<script lang="ts">
	import { page } from '$app/stores';
	import { Film, Users, Trophy, Menu } from 'lucide-svelte';
	import { sidebar } from '../stores/sidebar';
	import { i18nStore } from '$lib/i18n';
	import LanguageSwitcher from '$lib/LanguageSwitcher.svelte';

	export let roomPhase: 'join' | 'waiting' | 'nominating' | 'nominate' | 'voting' | 'vote' | 'complete' | 'results' | null = null;
	export let roomCode: string | null = null;
	export let participants: Array<{ id: string; nickname: string }> = [];

	function toggleSidebar() {
		sidebar.set({ isOpen: true, view: 'library' });
	}
</script>

<header class="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-white/10">
	<div class="max-w-7xl mx-auto px-4 py-3">
		<div class="flex justify-between items-center">
			<!-- Logo and Navigation -->
			<div class="flex items-center gap-6">
				<a href="/" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
					<div class="text-white font-bold text-2xl">
						<span>Wat</span>
						<span class="text-[#E50914]">sch</span>
					</div>
				</a>
				<nav class="flex items-center gap-6">
					<a
						href="/movie-night"
						class="flex items-center gap-2 px-4 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
					>
						<span class="text-xl transform transition-transform group-hover:rotate-12">🎬</span>
						<span class="text-lg">{$i18nStore.t('movie_night.title')}</span>
					</a>
				</nav>
			</div>

			<!-- Elegant Language Switcher -->
			<div class="hidden md:flex items-center gap-4">
				<LanguageSwitcher />
			</div>

			<!-- Room Info -->
			{#if roomPhase && roomPhase !== 'join'}
				<div class="hidden md:flex items-center gap-4">
					<!-- Room Code -->
					{#if roomCode}
						<div class="flex items-center gap-2 text-white/70">
							<span class="text-sm">{$i18nStore.t('movie_night.room')}</span>
							<code class="bg-white/10 px-2 py-1 rounded text-sm">{roomCode}</code>
						</div>
					{/if}

					<!-- Phase Indicator -->
					<div class="flex items-center gap-2 text-white/70">
						<div class="px-2 py-1 rounded bg-white/10 text-sm capitalize flex items-center gap-1">
							{#if roomPhase === 'waiting'}
								<Users size={14} class="transform transition-transform group-hover:rotate-12" />
								<span>{$i18nStore.t('movie_night.waiting')}</span>
							{:else if roomPhase === 'nominating' || roomPhase === 'nominate'}
								<Film size={14} class="transform transition-transform group-hover:rotate-12" />
								<span>{$i18nStore.t('movie_night.nomination_phase')}</span>
							{:else if roomPhase === 'voting' || roomPhase === 'vote'}
								<Trophy size={14} class="transform transition-transform group-hover:rotate-12" />
								<span>{$i18nStore.t('movie_night.voting_phase')}</span>
							{:else if roomPhase === 'complete' || roomPhase === 'results'}
								<Trophy
									size={14}
									class="text-[#E50914] transform transition-transform group-hover:rotate-12"
								/>
								<span>{$i18nStore.t('movie_night.winner')}</span>
							{/if}
						</div>
					</div>

					<!-- Participants -->
					{#if participants.length > 0}
						<div class="flex items-center gap-2 text-white/70">
							<Users size={14} class="transform transition-transform group-hover:rotate-12" />
							<span class="text-sm">{participants.length} {$i18nStore.t('common.friends', { count: participants.length })}</span>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Sidebar Toggle -->
			<button
				class="p-2 text-white/50 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-300 hover:scale-105 group"
				on:click={toggleSidebar}
			>
				<Menu size={20} class="transform transition-transform group-hover:rotate-12" />
			</button>
		</div>
	</div>
</header>

<style>
	:global(.group:hover .transform) {
		transform: rotate(12deg);
	}
</style>
