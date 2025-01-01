export interface Recommendation {
    title: string;
    description: string;
    type?: 'movie' | 'tv';
}

export interface SavedItem {
    id: string;
    title: string;
    year: string | number;
    poster: string;
    platforms: string[];
    rating?: number | null;
    genre?: string;
} 