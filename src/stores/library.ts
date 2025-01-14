import { writable } from 'svelte/store';

export interface SavedItem {
	id: string;
	title: string;
	year: string;
	poster: string;
	platforms: string[];
	rating: number | null;
	genre: string;
	tmdbId: string;
}

export interface Movie {
	id: string;
	title: string;
	description: string;
	poster_path?: string;
	release_date?: string;
}

function createLibraryStore() {
	const { subscribe, update } = writable<{ movies: Movie[]; saved: SavedItem[] }>({
		movies: [],
		saved: []
	});

	return {
		subscribe,
		addMovie: (movie: Movie) => {
			update((currentLibrary) => {
				if (!currentLibrary.movies.some((m) => m.id === movie.id)) {
					console.log('Movie added to library:', movie);
					return { ...currentLibrary, movies: [...currentLibrary.movies, movie] };
				}
				return currentLibrary;
			});
		},
		addToSaved: (savedItem: SavedItem) => {
			update((currentLibrary) => {
				if (!currentLibrary.saved.some((item) => item.id === savedItem.id)) {
					console.log('Item added to saved:', savedItem);
					return { ...currentLibrary, saved: [...currentLibrary.saved, savedItem] };
				}
				return currentLibrary;
			});
		},
		removeFromSaved: (itemId: string) => {
			update((currentLibrary) => ({
				...currentLibrary,
				saved: currentLibrary.saved.filter((item) => item.id !== itemId)
			}));
		}
	};
}

export const library = createLibraryStore(); 