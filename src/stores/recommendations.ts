import { writable } from 'svelte/store';
import type { Recommendation } from '../lib/RecommendationCard.svelte';
export const recommendationsStore = writable<Recommendation[]>([]); 