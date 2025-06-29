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

// Expanded mock data with variety
function getMockRecommendations(mediaType: 'movie' | 'tv'): ProcessedResult[] {
  const allMockMovies: ProcessedResult[] = [
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
    },
    {
      id: 550,
      title: "Fight Club",
      description: "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.",
      type: 'movie',
      year: 1999,
      rating: 84,
      poster_path: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      backdrop_path: "https://image.tmdb.org/t/p/original/52AfXWuXCHn3UjD17rBruA9f5qb.jpg",
      popularity: 61.4,
      genre_ids: [18],
      original_language: "en"
    },
    {
      id: 13,
      title: "Forrest Gump",
      description: "A man with a low IQ has accomplished great things in his life and been present during significant historic events.",
      type: 'movie',
      year: 1994,
      rating: 85,
      poster_path: "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
      backdrop_path: "https://image.tmdb.org/t/p/original/3h1JZGDhZ8nzxdgvkxha0qBqi05.jpg",
      popularity: 75.8,
      genre_ids: [35, 18, 10749],
      original_language: "en"
    },
    {
      id: 157336,
      title: "Interstellar",
      description: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.",
      type: 'movie',
      year: 2014,
      rating: 85,
      poster_path: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
      backdrop_path: "https://image.tmdb.org/t/p/original/bn6yw7fmNj5SdDpgKu8jNjGFP3e.jpg",
      popularity: 98.5,
      genre_ids: [12, 18, 878],
      original_language: "en"
    },
    {
      id: 680,
      title: "Pulp Fiction",
      description: "A burger-loving hit man, his philosophical partner, a drug-addled gangster's moll and a washed-up boxer converge in this sprawling crime caper.",
      type: 'movie',
      year: 1994,
      rating: 85,
      poster_path: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
      backdrop_path: "https://image.tmdb.org/t/p/original/dRZXoaJdhPx6u7uw8xNPJN6yiph.jpg",
      popularity: 67.3,
      genre_ids: [53, 80],
      original_language: "en"
    },
    {
      id: 278,
      title: "The Shawshank Redemption",
      description: "Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison.",
      type: 'movie',
      year: 1994,
      rating: 87,
      poster_path: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
      backdrop_path: "https://image.tmdb.org/t/p/original/iNh3BivHyg5sQRPP1KOkzguEX0H.jpg",
      popularity: 88.9,
      genre_ids: [18, 80],
      original_language: "en"
    }
  ];

  const allMockTV: ProcessedResult[] = [
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
    },
    {
      id: 1408,
      title: "House",
      description: "Dr. Gregory House is a maverick physician who is devoid of bedside manner. While his behavior can border on antisocial, Dr. House thrives on the challenge of solving the medical puzzles that other doctors give up on.",
      type: 'tv',
      year: 2004,
      rating: 86,
      poster_path: "https://image.tmdb.org/t/p/w500/3Cz7ySOQJmqiuTdrc6CY0r65yDI.jpg",
      backdrop_path: "https://image.tmdb.org/t/p/original/orFQbyeoF71cKwVbhf4fJTnpGMV.jpg",
      popularity: 86.8,
      genre_ids: [18, 9648],
      original_language: "en"
    },
    {
      id: 60735,
      title: "The Flash",
      description: "After a particle accelerator causes a freak storm, CSI Investigator Barry Allen is struck by lightning and falls into a coma.",
      type: 'tv',
      year: 2014,
      rating: 77,
      poster_path: "https://image.tmdb.org/t/p/w500/lJA2RCMfsWoskqlQhXPSLFQGXEJ.jpg",
      backdrop_path: "https://image.tmdb.org/t/p/original/9ypt6O9FZZQ7gGBptL7AfUK0eG7.jpg",
      popularity: 88.3,
      genre_ids: [18, 10765],
      original_language: "en"
    },
    {
      id: 1412,
      title: "The Office",
      description: "The everyday lives of office employees in the Scranton, Pennsylvania branch of the fictional Dunder Mifflin Paper Company.",
      type: 'tv',
      year: 2005,
      rating: 87,
      poster_path: "https://image.tmdb.org/t/p/w500/qWnJzyZhyy74gjpSjIXWmuk0ifX.jpg",
      backdrop_path: "https://image.tmdb.org/t/p/original/7oKHWhDDh3zNcizSKhcsCSxVmqS.jpg",
      popularity: 85.4,
      genre_ids: [35],
      original_language: "en"
    },
    {
      id: 60059,
      title: "Better Call Saul",
      description: "Six years before Saul Goodman meets Walter White. We meet him when the man who will become Saul Goodman is known as Jimmy McGill, a small-time lawyer searching for his destiny.",
      type: 'tv',
      year: 2015,
      rating: 85,
      poster_path: "https://image.tmdb.org/t/p/w500/dC6I7LZqeKFz4JqeVrywP5iCe2b.jpg",
      backdrop_path: "https://image.tmdb.org/t/p/original/bEowlHdCHr5Bx4j0pSX2aYSjpNu.jpg",
      popularity: 72.5,
      genre_ids: [18, 80],
      original_language: "en"
    }
  ];

  // Shuffle and return random selection
  const sourceArray = mediaType === 'tv' ? allMockTV : allMockMovies;
  const shuffled = [...sourceArray].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 5);
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