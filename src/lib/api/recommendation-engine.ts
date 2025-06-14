import { TMDB_API_KEY as PRIVATE_TMDB_API_KEY } from '$lib/env-loader';

interface RecommendationParams {
  query: string;
  mediaType: 'movie' | 'tv';
  genres?: string[];
  platforms?: string[];
}

interface SearchIntent {
  type: 'actor_search' | 'keyword_search' | 'genre_search' | 'mixed_search';
  actors: string[];
  keywords: string[];
  genres: string[];
  mood?: string;
  era?: string;
  sortBy?: string;
}

interface TMDBResult {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  poster_path: string | null;
  backdrop_path: string | null;
  popularity: number;
  genre_ids: number[];
  original_language?: string;
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

// Analyze user input to understand their intent
function analyzeUserInput(input: string): SearchIntent {
  const intent: SearchIntent = {
    type: 'keyword_search',
    actors: [],
    keywords: [],
    genres: []
  };

  // Handle empty or 'any' query case
  if (!input || input.toLowerCase() === 'any') {
    console.log('Empty or "any" query detected, using default search intent');
    return intent;
  }

  // Convert input to lowercase for easier processing
  const lowerInput = input.toLowerCase();
  const words = input.split(/\s+/);
  
  // Common patterns to detect
  const actorPatterns = [
    /\b(?:with|starring|features?|acted by|plays?(?:ing)? (?:by|in)|actor|actress)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:movies?|films?|shows?)/g
  ];

  // Check for actor patterns
  actorPatterns.forEach(pattern => {
    const matches = [...input.matchAll(pattern)];
    matches.forEach(match => {
      if (match[1]) {
        intent.actors.push(match[1].trim());
      }
    });
  });

  // Detect mood/tone
  const moodKeywords = {
    funny: ['funny', 'comedy', 'hilarious', 'laugh'],
    serious: ['serious', 'drama', 'dramatic', 'intense'],
    scary: ['scary', 'horror', 'frightening', 'spooky'],
    action: ['action', 'exciting', 'thrilling', 'adventure'],
    romantic: ['romantic', 'romance', 'love story'],
    family: ['family', 'kids', 'children', 'family-friendly']
  };

  for (const [mood, keywords] of Object.entries(moodKeywords)) {
    if (keywords.some(keyword => lowerInput.includes(keyword))) {
      intent.mood = mood;
      break;
    }
  }

  // Detect era/time period
  const eraPatterns = {
    recent: /(?:new|recent|latest|modern)/,
    classics: /(?:classic|old|vintage)/,
    specific_decade: /(?:from the |in the |)(\d{4}s|\d{2}s)/
  };

  for (const [era, pattern] of Object.entries(eraPatterns)) {
    if (pattern.test(lowerInput)) {
      const match = lowerInput.match(pattern);
      intent.era = match?.[1] || era;
    }
  }

  // Extract meaningful keywords (excluding common words)
  const commonWords = new Set(['movie', 'film', 'show', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by']);
  words.forEach(word => {
    if (word.length > 2 && !commonWords.has(word.toLowerCase())) {
      intent.keywords.push(word.toLowerCase());
    }
  });

  // Determine search type based on what we found
  if (intent.actors.length > 0) {
    intent.type = intent.keywords.length > 0 ? 'mixed_search' : 'actor_search';
  } else if (intent.mood) {
    intent.type = 'genre_search';
  }

  return intent;
}

async function searchByActor(actorName: string, mediaType: 'movie' | 'tv'): Promise<TMDBResult[]> {
  if (!PRIVATE_TMDB_API_KEY) {
    console.error('TMDB API key is not configured');
    throw new Error('TMDB API key is not configured');
  }

  // First search for the actor
  const personUrl = new URL('https://api.themoviedb.org/3/search/person');
  personUrl.searchParams.append('api_key', PRIVATE_TMDB_API_KEY);
  personUrl.searchParams.append('query', actorName);

  try {
    const personResponse = await fetch(personUrl.toString());
    if (!personResponse.ok) {
      throw new Error(`Person search failed: ${personResponse.statusText}`);
    }

    const personData = await personResponse.json();
    if (personData.results && personData.results.length > 0) {
      const personId = personData.results[0].id;
      
      // Then get their movies/shows
      const creditsUrl = new URL(`https://api.themoviedb.org/3/person/${personId}/${mediaType}_credits`);
      creditsUrl.searchParams.append('api_key', PRIVATE_TMDB_API_KEY);
      
      const creditsResponse = await fetch(creditsUrl.toString());
      if (!creditsResponse.ok) {
        throw new Error(`Credits search failed: ${creditsResponse.statusText}`);
      }

      const creditsData = await creditsResponse.json();
      return creditsData.cast || [];
    }
    return [];
  } catch (error) {
    console.error(`Error searching for actor "${actorName}":`, error);
    throw error;
  }
}

async function searchByKeywords(keywords: string[], mediaType: 'movie' | 'tv'): Promise<TMDBResult[]> {
  if (!PRIVATE_TMDB_API_KEY) {
    console.error('TMDB API key is not configured');
    throw new Error('TMDB API key is not configured');
  }

  const url = new URL(`https://api.themoviedb.org/3/search/${mediaType}`);
  url.searchParams.append('api_key', PRIVATE_TMDB_API_KEY);
  url.searchParams.append('query', keywords.join(' '));
  url.searchParams.append('language', 'en-US');

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Keyword search failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error searching by keywords:', error);
    throw error;
  }
}

function processResults(results: TMDBResult[], mediaType: 'movie' | 'tv'): ProcessedResult[] {
  return results
    .map(item => ({
      id: item.id,
      title: item.title || item.name || '',
      description: item.overview,
      type: mediaType,
      year: (item.release_date || item.first_air_date)
        ? new Date(item.release_date || item.first_air_date || '').getFullYear()
        : null,
      rating: Math.round(item.vote_average * 10),
      poster_path: item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : null,
      backdrop_path: item.backdrop_path
        ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
        : null,
      popularity: item.popularity,
      genre_ids: item.genre_ids,
      original_language: (item.original_language || 'en').toUpperCase()
    }))
    .filter((item): item is ProcessedResult => 
      !!item.title && item.title.length > 0
    )
    .sort((a, b) => b.popularity - a.popularity);
}

function shuffleArray<T>(array: T[]): T[] {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

export async function getRecommendations({ query, mediaType, genres = [], platforms = [] }: RecommendationParams): Promise<ProcessedResult[]> {
  console.log('[Debug] getRecommendations params:', { query, mediaType, genres, platforms });

  if (!PRIVATE_TMDB_API_KEY) {
    console.error('TMDB API key is not configured');
    throw new Error('TMDB API key is not configured');
  }

  // Validate and sanitize input
  const sanitizedQuery = query?.trim() || 'any';
  const validMediaType = mediaType === 'tv' ? 'tv' : 'movie';

  // First, analyze what the user is looking for
  const intent = analyzeUserInput(sanitizedQuery);
  console.log('Analyzed intent:', intent);

  let results: TMDBResult[] = [];

  try {
    switch (intent.type) {
      case 'actor_search':
        // Search by actor name(s)
        for (const actor of intent.actors) {
          const actorResults = await searchByActor(actor, validMediaType);
          results = [...results, ...actorResults];
        }
        break;

      case 'mixed_search':
        // Combine actor and keyword search
        const actorResults = await Promise.all(
          intent.actors.map(actor => searchByActor(actor, validMediaType))
        );
        const keywordResults = await searchByKeywords(intent.keywords, validMediaType);
        
        // Merge results, prioritizing items that appear in both searches
        results = [...new Set([...actorResults.flat(), ...keywordResults])];
        break;

      case 'genre_search':
      case 'keyword_search':
      default: {
        // Use discover API for more refined search
        // First, get total pages (max 500)
        const urlForPageCount = new URL(`https://api.themoviedb.org/3/discover/${validMediaType}`);
        urlForPageCount.searchParams.append('api_key', PRIVATE_TMDB_API_KEY);
        urlForPageCount.searchParams.append('language', 'en-US');
        urlForPageCount.searchParams.append('sort_by', 'popularity.desc');
        if (intent.era) {
          const year = parseInt(intent.era);
          if (!isNaN(year)) {
            urlForPageCount.searchParams.append('primary_release_year', year.toString());
          }
        }
        if (genres.length > 0) {
          urlForPageCount.searchParams.append('with_genres', genres.join(','));
        }
        // Fetch first page to get total_pages
        const firstPageResp = await fetch(urlForPageCount.toString());
        if (!firstPageResp.ok) {
          throw new Error(`Discover search failed: ${firstPageResp.statusText}`);
        }
        const firstPageData = await firstPageResp.json();
        const totalPages = Math.min(firstPageData.total_pages || 1, 500);
        // Pick a random page
        const randomPage = Math.floor(Math.random() * totalPages) + 1;
        const url = new URL(`https://api.themoviedb.org/3/discover/${validMediaType}`);
        url.searchParams.append('api_key', PRIVATE_TMDB_API_KEY);
        url.searchParams.append('language', 'en-US');
        url.searchParams.append('sort_by', 'popularity.desc');
        url.searchParams.append('page', randomPage.toString());
        if (intent.era) {
          const year = parseInt(intent.era);
          if (!isNaN(year)) {
            url.searchParams.append('primary_release_year', year.toString());
          }
        }
        if (genres.length > 0) {
          url.searchParams.append('with_genres', genres.join(','));
        }
        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`Discover search failed: ${response.statusText}`);
        }
        const data = await response.json();
        results = data.results || [];
        break;
      }
    }

    // Process and return top results
    const processedResults = processResults(results, validMediaType);
    const shuffled = shuffleArray(processedResults);
    
    // Add debug info to help improve the engine
    console.log('Search debug:', {
      originalQuery: query,
      sanitizedQuery,
      analyzedIntent: intent,
      resultCount: shuffled.length,
      topResults: shuffled.map(r => r.title)
    });

    if (shuffled.length === 0) {
      // No results found, return empty array instead of throwing
      return [];
    }

    return shuffled.slice(0, 5);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to get recommendations: ${error.message}`);
    }
    throw new Error('Failed to get recommendations');
  }
} 