import { api } from '$lib/api';

interface RecommendationParams {
  query: string;
  mediaType: 'movie' | 'tv';
  genres?: string[];
  platforms?: string[];
}



interface ProcessedResult {
  id: number;
  title: string;
  description: string;
  type: 'movie' | 'tv';
  year: number | null;
  rating: number;
  poster_path: string | null;
  backdrop_path: string | null;
  popularity: number;
  genre_ids: number[];
  original_language: string;
}

// Genre mapping for user-friendly genre names to TMDB IDs
const genreMap: { [key: string]: number } = {
  // English names
  Action: 28,
  Adventure: 12,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  Fantasy: 14,
  Horror: 27,
  Mystery: 9648,
  Romance: 10749,
  'Sci-Fi': 878,
  'Science Fiction': 878,
  Thriller: 53,
  War: 10752,
  Western: 37,
  // German names
  Abenteuer: 12,
  Animationsfilm: 16,
  Komödie: 35,
  Krimi: 80,
  Dokumentarfilm: 99,
  Familie: 10751,
  Fantasie: 14,
  Romanze: 10749,
  // Alternative mappings
  Abenteurer: 12
};

// Mock data fallback
function getMockRecommendations(mediaType: 'movie' | 'tv'): ProcessedResult[] {
  const mockMovies: ProcessedResult[] = [
    {
      id: 299536,
      title: "Avengers: Infinity War",
      description: "As the Avengers and their allies have continued to protect the world from threats too large for any one hero to handle, a new danger has emerged from the cosmic shadows: Thanos.",
      type: 'movie',
      year: 2018,
      rating: 83,
      poster_path: "https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg",
      backdrop_path: "https://image.tmdb.org/t/p/original/bOGkgRGdhrBYJSLpXaxhXVstddV.jpg",
      popularity: 83.2,
      genre_ids: [28, 12, 878],
      original_language: "en"
    },
    {
      id: 299537,
      title: "Captain Marvel",
      description: "The story follows Carol Danvers as she becomes one of the universe's most powerful heroes when Earth is caught in the middle of a galactic war between two alien races.",
      type: 'movie',
      year: 2019,
      rating: 68,
      poster_path: "https://image.tmdb.org/t/p/w500/AtsgWhDnHTq68L0lLsUrCnM7TjG.jpg",
      backdrop_path: "https://image.tmdb.org/t/p/original/w2PMyoyLU22YvrGK3smVM9fW1jj.jpg",
      popularity: 73.4,
      genre_ids: [28, 12, 878],
      original_language: "en"
    },
    {
      id: 181808,
      title: "Star Wars: The Last Jedi",
      description: "Rey develops her newly discovered abilities with the guidance of Luke Skywalker, who is unsettled by the strength of her powers.",
      type: 'movie',
      year: 2017,
      rating: 70,
      poster_path: "https://image.tmdb.org/t/p/w500/kOVEVeg59E0wsnXmF9nrh6OmWII.jpg",
      backdrop_path: "https://image.tmdb.org/t/p/original/5Iw7zQTHVRBOYpA0V6z0yypOPZh.jpg",
      popularity: 65.1,
      genre_ids: [28, 12, 14, 878],
      original_language: "en"
    }
  ];

  const mockTV: ProcessedResult[] = [
    {
      id: 1399,
      title: "Game of Thrones",
      description: "Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war.",
      type: 'tv',
      year: 2011,
      rating: 83,
      poster_path: "https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
      backdrop_path: "https://image.tmdb.org/t/p/original/suopoADq0k8YZr4dQXcU6pToj6s.jpg",
      popularity: 84.0,
      genre_ids: [18, 10765, 10759],
      original_language: "en"
    },
    {
      id: 1396,
      title: "Breaking Bad",
      description: "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family's future.",
      type: 'tv',
      year: 2008,
      rating: 95,
      poster_path: "https://image.tmdb.org/t/p/w500/3xnWaLQjelJDDF7LT1WBo6f4BRe.jpg",
      backdrop_path: "https://image.tmdb.org/t/p/original/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
      popularity: 93.2,
      genre_ids: [18, 80],
      original_language: "en"
    },
    {
      id: 1668,
      title: "Friends",
      description: "The misadventures of a group of friends as they navigate the pitfalls of work, life and love in Manhattan.",
      type: 'tv',
      year: 1994,
      rating: 84,
      poster_path: "https://image.tmdb.org/t/p/w500/2koX1xLkpTQM4IZebYvKysFW1Nh.jpg",
      backdrop_path: "https://image.tmdb.org/t/p/original/fDYla1yhAgJA7DQzJGf3fVnyUr6.jpg",
      popularity: 84.0,
      genre_ids: [35],
      original_language: "en"
    }
  ];

  return mediaType === 'tv' ? mockTV : mockMovies;
}

// Convert genre names to TMDB genre IDs
function parseGenres(genres: string[]): number[] {
  return genres
    .map(genre => genreMap[genre])
    .filter(id => id !== undefined);
}

// Process TMDB results to our standard format
function processResults(results: any[], mediaType: 'movie' | 'tv'): ProcessedResult[] {
  return results.map(item => ({
    id: item.id,
    title: item.title || item.name || '',
    description: item.overview || item.description || '',
    type: mediaType,
    year: item.release_date ? parseInt(item.release_date.split('-')[0]) : 
          item.first_air_date ? parseInt(item.first_air_date.split('-')[0]) : null,
    rating: Math.round(item.vote_average * 10),
    poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
    backdrop_path: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
    popularity: item.popularity || 0,
    genre_ids: item.genre_ids || [],
    original_language: item.original_language || 'en'
  }));
}

export async function getRecommendations({ query, mediaType, genres = [], platforms = [] }: RecommendationParams): Promise<ProcessedResult[]> {
  console.log('[Debug] getRecommendations params:', { query, mediaType, genres, platforms });

  try {
    const manager = api.getInstance();
    
    // Check if API is available
    const health = manager.getHealth();
    if (!health.initialized) {
      console.warn('API Manager not initialized, using mock data');
      return getMockRecommendations(mediaType);
    }

    // Convert genre names to IDs
    const genreIds = parseGenres(genres);
    
    // Use the API manager's getRecommendations method
    const result = await manager.getRecommendations({
      query: query || 'any',
      mediaType: mediaType as 'movie' | 'tv',
      genres: genreIds,
      platforms,
      minRating: undefined
    });

    console.log('[getRecommendation] API manager returned:', result);

    // Extract results from the response
    const results = result?.data?.data?.results || result?.data?.results || result?.results || [];
    
    if (results.length === 0) {
      console.log('[getRecommendation] No results found, using mock data fallback');
      return getMockRecommendations(mediaType);
    }

    // Process and return results
    const processedResults = processResults(results, mediaType);
    console.log('[getRecommendation] Returning processed results:', processedResults.length, 'items');
    
    return processedResults.slice(0, 5); // Limit to 5 results

  } catch (error) {
    console.error('Recommendation engine error:', error);
    console.log('Falling back to mock data due to error');
    return getMockRecommendations(mediaType);
  }
} 