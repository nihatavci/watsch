import { writable } from 'svelte/store';

type SidebarState = {
    isOpen: boolean;
    view: 'library' | 'recommendations' | null;
};

export const sidebar = writable<SidebarState>({
    isOpen: false,
    view: null
}); 