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

// You can add other shared types here as well
export interface Recommendation {
    title: string;
    description: string;
    type: string;
} 