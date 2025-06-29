import { writable } from 'svelte/store';

export interface Recommendation {
	title: string;
	description: string;
	type: 'movie' | 'tv';
	id: number;
	year: number | null;
	rating: number;
	poster_path: string | null;
	backdrop_path: string | null;
	popularity: number;
	genre_ids: number[];
	original_language: string;
}

export const recommendationsStore = writable<Recommendation[]>([]); 