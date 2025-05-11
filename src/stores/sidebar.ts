import { writable } from 'svelte/store';

type SidebarState = {
	isOpen: boolean;
	view: 'library' | 'watchlist' | 'recommendations' | null;
};

function createSidebar() {
	const { subscribe, set, update } = writable<SidebarState>({
		isOpen: false,
		view: null
	});

	return {
		subscribe,
		set,
		update,
		toggle: () => update((state) => ({ ...state, isOpen: !state.isOpen })),
		showLibrary: () => update((state) => ({ ...state, isOpen: true, view: 'library' })),
		showWatchlist: () => update((state) => ({ ...state, isOpen: true, view: 'watchlist' })),
		showRecommendations: () =>
			update((state) => ({ ...state, isOpen: true, view: 'recommendations' })),
		close: () => update((state) => ({ ...state, isOpen: false, view: null }))
	};
}

export const sidebar = createSidebar();
