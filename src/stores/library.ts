import { writable } from 'svelte/store';

export interface LibraryState {
	isOpen: boolean;
	movies: any[];
	selectedMovie: any | null;
	isSelectionMode: boolean;
}

function createLibraryStore() {
	const { subscribe, set, update } = writable<LibraryState>({
		isOpen: false,
		movies: [],
		selectedMovie: null,
		isSelectionMode: false
	});

	return {
		subscribe,
		addToLibrary: (movie: any) =>
			update((state) => ({
				...state,
				movies: [...state.movies, movie]
			})),
		removeFromLibrary: (movie: any) =>
			update((state) => ({
				...state,
				movies: state.movies.filter((m) => m.title !== movie.title)
			})),
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
				isSelectionMode: true,
				selectedMovie: null
			})),
		selectMovie: (movie: any) =>
			update((state) => ({
				...state,
				selectedMovie: movie,
				isOpen: false,
				isSelectionMode: false
			})),
		reset: () =>
			set({
				isOpen: false,
				movies: [],
				selectedMovie: null,
				isSelectionMode: false
			})
	};
}

export const library = createLibraryStore(); 