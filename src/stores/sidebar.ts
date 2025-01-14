import { writable } from 'svelte/store';

type SidebarState = {
    isOpen: boolean;
    view: 'library' | 'recommendations' | null;
};

interface SidebarState {
	isOpen: boolean;
	view: string | null;
}

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
		setView: (view: string) => update((state) => ({ ...state, view }))
	};
}

export const sidebar = createSidebar();