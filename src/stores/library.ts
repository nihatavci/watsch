import { writable } from 'svelte/store';
import type { SavedItem } from '../lib/types';

export interface SearchHistory {
	id: string;
	query: string;
	timestamp: Date;
}

interface LibraryState {
	savedItems: SavedItem[];
	searchHistory: SearchHistory[];
}

// Load initial state from localStorage
const storedLibrary = typeof window !== 'undefined' ? localStorage.getItem('library') : null;
const initialState: LibraryState = storedLibrary 
	? JSON.parse(storedLibrary)
	: { savedItems: [], searchHistory: [] };

function createLibraryStore() {
	const { subscribe, update } = writable<LibraryState>(initialState);

	// Helper to save state to localStorage
	function saveToStorage(state: LibraryState) {
		if (typeof window !== 'undefined') {
			localStorage.setItem('library', JSON.stringify(state));
		}
		return state;
	}

	return {
		subscribe,
		addToSaved: (item: SavedItem) => update(state => 
			saveToStorage({
				...state,
				savedItems: [item, ...state.savedItems]
			})
		),
		removeFromSaved: (title: string) => update(state => 
			saveToStorage({
				...state,
				savedItems: state.savedItems.filter(item => item.title !== title)
			})
		),
		addToHistory: (query: string) => update(state => 
			saveToStorage({
				...state,
				searchHistory: [{
					id: Date.now().toString(),
					query,
					timestamp: new Date()
				}, ...state.searchHistory]
			})
		),
		clearHistory: () => update(state => 
			saveToStorage({
				...state,
				searchHistory: []
			})
		),
		reset: () => update(state => 
			saveToStorage({
				savedItems: [],
				searchHistory: []
			})
		)
	};
}

export const library = createLibraryStore(); 