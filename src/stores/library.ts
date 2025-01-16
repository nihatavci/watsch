import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { sidebar } from './sidebar';

export interface SavedItem {
	id: string;
	title: string;
	year: string;
	poster: string | null;
	platforms: string[];
	rating: number | null;
	genre: string;
	tmdbId: string | null;
}

interface LibraryState {
	saved: SavedItem[];
	movies?: Movie[];
	selectedMovie?: Movie | null;
}

interface Movie {
	id: string;
	title: string;
	release_date?: string;
	poster_path?: string;
}

function createLibraryStore() {
	const defaultState: LibraryState = { saved: [] };
	
	// Load initial state from localStorage if available
	const initialState: LibraryState = browser ? 
		JSON.parse(localStorage.getItem('library') || JSON.stringify(defaultState)) : 
		defaultState;

	const { subscribe, update } = writable<LibraryState>(initialState);

	// Save to localStorage whenever the store changes
	if (browser) {
		subscribe(state => {
			localStorage.setItem('library', JSON.stringify(state));
		});
	}

	return {
		subscribe,
		addToSaved: (savedItem: SavedItem) => {
			console.log('Adding to saved:', savedItem);
			update(state => {
				const saved = state.saved || [];
				if (!saved.some(item => item.id === savedItem.id)) {
					sidebar.showWatchlist();
					return { saved: [...saved, savedItem] };
				}
				return state;
			});
		},
		removeFromSaved: (itemId: string) => {
			update(state => ({
				saved: (state.saved || []).filter(item => item.id !== itemId)
			}));
		},
		selectMovie: (movie: Movie) => {
			update(state => ({ ...state, selectedMovie: movie }));
		}
	};
}

export const library = createLibraryStore(); 