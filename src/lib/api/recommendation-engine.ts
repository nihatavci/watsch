import { TMDB_API_KEY } from '$lib/env-loader';

interface RecommendationParams {
  query: string;
  mediaType: 'movie' | 'tv';
  genres?: string[];
  platforms?: string[];
}

interface SearchIntent {
  type: 'actor_search' | 'keyword_search' | 'genre_search' | 'mixed_search' | 'characteristic_search';
  actors: string[];
  keywords: string[];
  genres: string[];
  mood?: string;
  era?: string;
  sortBy?: string;
  characteristics?: string[];
  themes?: string[];
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
    genres: [],
    characteristics: [],
    themes: []
  };

  // Handle empty or 'any' query case
  if (!input || input.toLowerCase() === 'any') {
    console.log('Empty or "any" query detected, using default search intent');
    return intent;
  }

  // Convert input to lowercase for easier processing
  const lowerInput = input.toLowerCase();
  const words = input.split(/\s+/);
  
  // Enhanced patterns for character and theme detection
  const characteristicPatterns = {
    female_lead: /\b(female|woman|women|girl)\s*(lead|protagonist|hero|main\s*character|star)/i,
    male_lead: /\b(male|man|men|boy)\s*(lead|protagonist|hero|main\s*character|star)/i,
    strong_female: /\b(strong|powerful|badass|tough)\s*(female|woman|women|girl)/i,
    lgbtq: /\b(lgbtq?|gay|lesbian|trans|queer|pride)/i,
    diverse_cast: /\b(diverse|diversity|multicultural|representation)/i,
    ensemble: /\b(ensemble|group|team)\s*(cast|movie|film)/i
  };

  // Theme patterns
  const themePatterns = {
    friendship: /\b(friendship|friends|buddy|companion)/i,
    revenge: /\b(revenge|vengeance|payback|retribution)/i,
    survival: /\b(survival|survive|apocalypse|post-apocalyptic)/i,
    underdog: /\b(underdog|against\s*odds|unlikely\s*hero)/i,
    coming_of_age: /\b(coming\s*of\s*age|growing\s*up|teen|adolescent)/i,
    time_travel: /\b(time\s*travel|time\s*loop|temporal)/i,
    space: /\b(space|cosmic|galaxy|astronaut|alien)/i,
    war: /\b(war|military|soldier|battle|combat)/i,
    heist: /\b(heist|robbery|steal|thief|con\s*artist)/i,
    sports: /\b(sports|athlete|team|championship|game)/i
  };

  // Check for characteristics
  for (const [characteristic, pattern] of Object.entries(characteristicPatterns)) {
    if (pattern.test(lowerInput)) {
      intent.characteristics?.push(characteristic);
    }
  }

  // Check for themes
  for (const [theme, pattern] of Object.entries(themePatterns)) {
    if (pattern.test(lowerInput)) {
      intent.themes?.push(theme);
    }
  }

  // Common patterns to detect actors
  const actorPatterns = [
    /\b(?:with|starring|features?|acted by|plays?(?:ing)? (?:by|in)|actor|actress)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:movies?|films?|shows?)/g,
    /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g // Names (two capitalized words)
  ];

  // Check for actor patterns
  actorPatterns.forEach(pattern => {
    const matches = [...input.matchAll(pattern)];
    matches.forEach(match => {
      if (match[1]) {
        const potentialActor = match[1].trim();
        // Filter out common non-actor phrases
        const nonActorPhrases = ['Strong Female', 'Female Lead', 'Male Lead', 'The Movie', 'TV Show'];
        if (!nonActorPhrases.includes(potentialActor)) {
          intent.actors.push(potentialActor);
        }
      }
    });
  });

  // Detect mood/tone
  const moodKeywords = {
    funny: ['funny', 'comedy', 'hilarious', 'laugh', 'humor', 'witty'],
    serious: ['serious', 'drama', 'dramatic', 'intense', 'heavy', 'emotional'],
    scary: ['scary', 'horror', 'frightening', 'spooky', 'terrifying', 'creepy'],
    action: ['action', 'exciting', 'thrilling', 'adventure', 'explosive', 'fast-paced'],
    romantic: ['romantic', 'romance', 'love story', 'love', 'passionate'],
    family: ['family', 'kids', 'children', 'family-friendly', 'wholesome'],
    dark: ['dark', 'gritty', 'noir', 'bleak', 'disturbing'],
    uplifting: ['uplifting', 'inspiring', 'feel-good', 'heartwarming', 'positive'],
    mysterious: ['mysterious', 'mystery', 'enigmatic', 'puzzling', 'suspenseful']
  };

  for (const [mood, keywords] of Object.entries(moodKeywords)) {
    if (keywords.some(keyword => lowerInput.includes(keyword))) {
      intent.mood = mood;
      break;
    }
  }

  // Detect era/time period
  const eraPatterns = {
    recent: /\b(?:new|recent|latest|modern|contemporary|current|2020s?|2010s?)\b/,
    classics: /\b(?:classic|old|vintage|golden\s*age|timeless)\b/,
    specific_decade: /\b(?:from the |in the |)(\d{4}s?|\d{2}s)\b/,
    period: /\b(?:period|historical|history|medieval|victorian|ancient)\b/
  };

  for (const [era, pattern] of Object.entries(eraPatterns)) {
    if (pattern.test(lowerInput)) {
      const match = lowerInput.match(pattern);
      intent.era = match?.[1] || era;
    }
  }

  // Extract meaningful keywords (excluding common words and detected patterns)
  const commonWords = new Set([
    'movie', 'film', 'show', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
    'with', 'by', 'about', 'like', 'similar', 'recommend', 'find', 'search', 'looking', 'want',
    'need', 'please', 'can', 'you', 'me', 'i', 'my', 'something', 'anything'
  ]);
  
  words.forEach(word => {
    if (word.length > 2 && !commonWords.has(word.toLowerCase())) {
      // Don't add if it's part of a detected pattern
      const isPartOfPattern = 
        intent.characteristics?.some(c => c.toLowerCase().includes(word.toLowerCase())) ||
        intent.themes?.some(t => t.toLowerCase().includes(word.toLowerCase())) ||
        intent.actors.some(a => a.toLowerCase().includes(word.toLowerCase()));
      
      if (!isPartOfPattern) {
        intent.keywords.push(word.toLowerCase());
      }
    }
  });

  // Determine search type based on what we found
  if (intent.characteristics?.length || intent.themes?.length) {
    intent.type = intent.actors.length > 0 ? 'mixed_search' : 'characteristic_search';
  } else if (intent.actors.length > 0) {
    intent.type = intent.keywords.length > 0 ? 'mixed_search' : 'actor_search';
  } else if (intent.mood) {
    intent.type = 'genre_search';
  }

  console.log('Analyzed search intent:', intent);
  return intent;
}

async function searchByActor(actorName: string, mediaType: 'movie' | 'tv'): Promise<TMDBResult[]> {
  if (!TMDB_API_KEY) {
    console.warn('TMDB API key is not configured for actor search');
    return [];
  }

  // First search for the actor
  const personUrl = new URL('https://api.themoviedb.org/3/search/person');
  personUrl.searchParams.append('api_key', TMDB_API_KEY);
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
      creditsUrl.searchParams.append('api_key', TMDB_API_KEY);
      
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
  if (!TMDB_API_KEY) {
    console.warn('TMDB API key is not configured for keyword search');
    return [];
  }

  const url = new URL(`https://api.themoviedb.org/3/search/${mediaType}`);
  url.searchParams.append('api_key', TMDB_API_KEY);
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

  // Check if TMDB API key is configured
  if (!TMDB_API_KEY) {
    console.warn('TMDB API key is not configured, using mock data');
    
    // Return mock data for development/testing
    const mockResults: ProcessedResult[] = [
      {
        id: 299536,
        title: "Avengers: Infinity War",
        description: "As the Avengers and their allies have continued to protect the world from threats too large for any one hero to handle, a new danger has emerged from the cosmic shadows: Thanos.",
        type: mediaType,
        year: 2018,
        rating: 83,
        poster_path: "https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg",
        backdrop_path: "https://image.tmdb.org/t/p/original/bOGkgRGdhrBYJSLpXaxhXVstddV.jpg",
        popularity: 83.2,
        genre_ids: [28, 12, 878],
        original_language: "EN"
      },
      {
        id: 299537,
        title: "Captain Marvel",
        description: "The story follows Carol Danvers as she becomes one of the universe's most powerful heroes when Earth is caught in the middle of a galactic war between two alien races.",
        type: mediaType,
        year: 2019,
        rating: 68,
        poster_path: "https://image.tmdb.org/t/p/w500/AtsgWhDnHTq68L0lLsUrCnM7TjG.jpg",
        backdrop_path: "https://image.tmdb.org/t/p/original/w2PMyoyLU22YvrGK3smVM9fW1jj.jpg",
        popularity: 73.4,
        genre_ids: [28, 12, 878],
        original_language: "EN"
      },
      {
        id: 181808,
        title: "Star Wars: The Last Jedi",
        description: "Rey develops her newly discovered abilities with the guidance of Luke Skywalker, who is unsettled by the strength of her powers.",
        type: mediaType,
        year: 2017,
        rating: 70,
        poster_path: "https://image.tmdb.org/t/p/w500/kOVEVeg59E0wsnXmF9nrh6OmWII.jpg",
        backdrop_path: "https://image.tmdb.org/t/p/original/5Iw7zQTHVRBOYpA0V6z0yypOPZh.jpg",
        popularity: 65.1,
        genre_ids: [28, 12, 14, 878],
        original_language: "EN"
      }
    ];

    // Filter based on query if it contains specific keywords
    const lowerQuery = query?.toLowerCase() || '';
    let filteredResults = mockResults;
    
    if (lowerQuery.includes('female') || lowerQuery.includes('woman')) {
      // Prioritize Captain Marvel for female lead queries
      filteredResults = [mockResults[1], ...mockResults.filter((_, i) => i !== 1)];
    }
    
    return filteredResults.slice(0, 5);
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

      case 'characteristic_search':
        // Use keywords to search for movies matching characteristics
        const searchTerms = [
          ...intent.keywords,
          ...(intent.characteristics || []).map(c => {
            // Convert characteristic to searchable terms
            const termMap: Record<string, string[]> = {
              female_lead: ['female protagonist', 'woman lead', 'heroine'],
              male_lead: ['male protagonist', 'hero'],
              strong_female: ['strong woman', 'female action', 'girl power'],
              lgbtq: ['lgbt', 'gay', 'lesbian', 'queer'],
              diverse_cast: ['diversity', 'multicultural'],
              ensemble: ['ensemble cast', 'team']
            };
            return termMap[c] || [c.replace(/_/g, ' ')];
          }).flat(),
          ...(intent.themes || []).map(t => t.replace(/_/g, ' '))
        ];

        // Search with enhanced terms
        if (searchTerms.length > 0) {
          results = await searchByKeywords(searchTerms, validMediaType);
        }

        // If we have specific characteristics or themes, also use discover API with keywords
        if ((intent.characteristics?.length || intent.themes?.length) && results.length < 20) {
          const discoverUrl = new URL(`https://api.themoviedb.org/3/discover/${validMediaType}`);
          discoverUrl.searchParams.append('api_key', TMDB_API_KEY);
          discoverUrl.searchParams.append('language', 'en-US');
          discoverUrl.searchParams.append('sort_by', 'popularity.desc');
          
          // Add genre filters based on themes
          const themeGenreMap: Record<string, number[]> = {
            friendship: [35, 18], // Comedy, Drama
            revenge: [28, 53, 80], // Action, Thriller, Crime
            survival: [28, 53, 27], // Action, Thriller, Horror
            underdog: [18, 35], // Drama, Comedy
            coming_of_age: [18, 10749], // Drama, Romance
            time_travel: [878, 12], // Sci-Fi, Adventure
            space: [878, 12], // Sci-Fi, Adventure
            war: [10752, 18, 28], // War, Drama, Action
            heist: [80, 53], // Crime, Thriller
            sports: [18] // Drama
          };

          const themeGenres = intent.themes?.flatMap(t => themeGenreMap[t] || []) || [];
          const allGenres = [...new Set([...genres.map(Number), ...themeGenres])];
          
          if (allGenres.length > 0) {
            discoverUrl.searchParams.append('with_genres', allGenres.join(','));
          }

          const discoverResponse = await fetch(discoverUrl.toString());
          if (discoverResponse.ok) {
            const discoverData = await discoverResponse.json();
            results = [...results, ...(discoverData.results || [])];
          }
        }
        break;

      case 'genre_search':
      case 'keyword_search':
      default: {
        // Use discover API for more refined search
        const url = new URL(`https://api.themoviedb.org/3/discover/${validMediaType}`);
        url.searchParams.append('api_key', TMDB_API_KEY);
        url.searchParams.append('language', 'en-US');
        url.searchParams.append('sort_by', 'popularity.desc');
        
        if (intent.era) {
          const year = parseInt(intent.era);
          if (!isNaN(year)) {
            url.searchParams.append('primary_release_year', year.toString());
          }
        }
        
        // Map mood to genres
        const moodGenreMap: Record<string, number[]> = {
          funny: [35], // Comedy
          serious: [18], // Drama
          scary: [27], // Horror
          action: [28, 12], // Action, Adventure
          romantic: [10749], // Romance
          family: [10751, 16], // Family, Animation
          dark: [80, 53], // Crime, Thriller
          uplifting: [18, 10751], // Drama, Family
          mysterious: [9648, 53] // Mystery, Thriller
        };

        const moodGenres = intent.mood ? moodGenreMap[intent.mood] || [] : [];
        const allGenres = [...new Set([...genres.map(Number), ...moodGenres])];
        
        if (allGenres.length > 0) {
          url.searchParams.append('with_genres', allGenres.join(','));
        }

        // Add keyword search if we have keywords
        if (intent.keywords.length > 0) {
          url.searchParams.append('with_keywords', intent.keywords.join('|'));
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

    // Remove duplicates based on ID
    const uniqueResults = Array.from(
      new Map(results.map(item => [item.id, item])).values()
    );

    // Process and return top results
    const processedResults = processResults(uniqueResults, validMediaType);
    const shuffled = shuffleArray(processedResults);
    
    // Add debug info to help improve the engine
    console.log('Search debug:', {
      originalQuery: query,
      sanitizedQuery,
      analyzedIntent: intent,
      resultCount: shuffled.length,
      topResults: shuffled.slice(0, 5).map(r => r.title)
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