<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { i18nStore } from './i18n';
	import { Film, Users } from 'lucide-svelte';
	import Button from './ui/button.svelte';

	const dispatch = createEventDispatcher();
</script>

<div class="min-h-screen flex items-center justify-center">
	<div class="max-w-2xl mx-auto px-4 text-center">
		<h1 class="text-4xl md:text-6xl font-bold text-white mb-8">
			{$i18nStore.t('home.title')}
		</h1>
		<p class="text-lg text-white/70 mb-12 max-w-xl mx-auto">
			{$i18nStore.t('home.description')}
		</p>

		<div class="flex flex-col sm:flex-row gap-4 justify-center">
			<Button
				on:click={() => dispatch('solo')}
				class="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg transition-colors backdrop-blur-sm flex items-center justify-center gap-3"
			>
				<Film size={24} />
				{$i18nStore.t('home.solo_button')}
			</Button>
			<Button
				on:click={() => dispatch('group')}
				class="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg transition-colors backdrop-blur-sm flex items-center justify-center gap-3"
			>
				<Users size={24} />
				{$i18nStore.t('home.group_button')}
			</Button>
		</div>
	</div>
</div>
