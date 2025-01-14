import { writable } from 'svelte/store';
import type { SavedItem, Movie } from '$lib/types';

function createLibraryStore() {
	const { subscribe, update } = writable<{ movies: Movie[]; saved: SavedItem[] }>({
		movies: [],
		saved: []
	});

	return {
		subscribe,
		addMovie: (movie: Movie) => {
			update((currentLibrary) => {
				if (!currentLibrary.movies?.some((m) => m.id === movie.id)) {
					console.log('Movie added to library:', movie);
					return { ...currentLibrary, movies: [...(currentLibrary.movies || []), movie] };
				}
				return currentLibrary;
			});
		},
		addToSaved: (savedItem: SavedItem) => {
			update((currentLibrary) => {
				if (!currentLibrary.saved?.some((item) => item.id === savedItem.id)) {
					console.log('Item added to saved:', savedItem);
					return { ...currentLibrary, saved: [...(currentLibrary.saved || []), savedItem] };
				}
				console.log('Item already in saved:', savedItem);
				return currentLibrary;
			});
		},
		removeFromSaved: (itemId: string) => {
			update((currentLibrary) => ({
				...currentLibrary,
				saved: currentLibrary.saved?.filter((item) => item.id !== itemId) || []
			}));
		},
		toggle: () =>
			update((state) => ({
				...state,
				isOpen: !state.isOpen,
				isSelectionMode: false,
				selectedMovie: null
			})),
		openForSelection: () =>
			update((state) => ({
				...state,
				isOpen: true,
				isSelectionMode: true
			})),
		selectMovie: (movie: any) =>
			update((state) => ({
				...state,
				selectedMovie: movie,
				isSelectionMode: false,
				isOpen: false
			}))
	};
}

export const library = createLibraryStore(); 