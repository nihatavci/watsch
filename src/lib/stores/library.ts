import { writable } from 'svelte/store';

interface Movie {
    id: number;
    title: string;
    posterPath: string;
    overview: string;
    releaseDate: string;
    voteAverage: number;
}

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

interface LibraryState {
    saved: SavedItem[];
    savedItems: Movie[];
}

function createLibraryStore() {
    // Initialize with stored data or empty state
    const storedData = typeof localStorage !== 'undefined' 
        ? localStorage.getItem('library')
        : null;
    
    const initialState: LibraryState = storedData 
        ? JSON.parse(storedData)
        : { saved: [], savedItems: [] };

    const { subscribe, set, update } = writable<LibraryState>(initialState);

    return {
        subscribe,
        addToSaved: (savedItem: SavedItem) => {
            update(state => {
                const newState = {
                    ...state,
                    saved: [savedItem, ...state.saved]
                };
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('library', JSON.stringify(newState));
                }
                return newState;
            });
        },
        removeFromSaved: (itemId: string) => {
            update(state => {
                const newState = {
                    ...state,
                    saved: state.saved.filter(item => item.id !== itemId)
                };
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('library', JSON.stringify(newState));
                }
                return newState;
            });
        },
        // Helper to check if a movie is saved
        isSaved: (itemId: string) => {
            let isSaved = false;
            subscribe(state => {
                isSaved = state.saved.some(item => item.id === itemId);
            })();
            return isSaved;
        }
    };
}

export const library = createLibraryStore(); 