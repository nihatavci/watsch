import { PRIVATE_TMDB_API_KEY } from '$env/static/private';

interface SearchParams {
  query: string;
  mediaType: 'movie' | 'tv';
  genres?: string[];
  platforms?: string[];
}

interface PersonSearchResult {
  id: number;
  name: string;
  popularity: number;
  profile_path: string | null;
}

interface MediaResult {
  id: number;
  title: string;
  name?: string;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  poster_path: string | null;
  backdrop_path: string | null;
  popularity: number;
  genre_ids: number[];
  original_language: string;
}

// Parse natural language query to extract search parameters
function parseNaturalLanguageQuery(query: string): {
  actorNames: string[];
  keywords: string[];
  timeframe?: string;
  genres?: string[];
} {
  const result = {
    actorNames: [] as string[],
    keywords: [] as string[],
    timeframe: undefined as string | undefined,
    genres: undefined as string[] | undefined,
  };

  // Common acting-related keywords
  const actingKeywords = ['play', 'actor', 'actress', 'star', 'starring', 'with', 'featuring'];
  
  // Split query into words
  const words = query.toLowerCase().split(/\s+/);
  
  let i = 0;
  while (i < words.length) {
    const word = words[i];
    
    // Check for actor names (usually capitalized in the original query)
    if (/^[A-Z]/.test(query.split(/\s+/)[i])) {
      let name = query.split(/\s+/)[i];
      // Look ahead for more name parts
      while (i + 1 < words.length && /^[A-Z]/.test(query.split(/\s+/)[i + 1])) {
        name += ' ' + query.split(/\s+/)[i + 1];
        i++;
      }
      result.actorNames.push(name);
    }
    
    // Check for acting-related keywords and extract associated names
    else if (actingKeywords.includes(word)) {
      let j = i - 1;
      let name = '';
      // Look backwards for name
      while (j >= 0 && /^[A-Z]/.test(query.split(/\s+/)[j])) {
        name = query.split(/\s+/)[j] + ' ' + name;
        j--;
      }
      if (name) {
        result.actorNames.push(name.trim());
      }
      
      // Look ahead for name if none found backwards
      if (!name) {
        j = i + 1;
        while (j < words.length && /^[A-Z]/.test(query.split(/\s+/)[j])) {
          name += ' ' + query.split(/\s+/)[j];
          j++;
        }
        if (name) {
          result.actorNames.push(name.trim());
        }
      }
    }
    
    // Extract other meaningful keywords
    else if (word.length > 2 && !['the', 'and', 'but', 'with'].includes(word)) {
      result.keywords.push(word);
    }
    
    i++;
  }
  
  // Remove duplicates and clean up
  result.actorNames = [...new Set(result.actorNames)];
  result.keywords = [...new Set(result.keywords)];
  
  return result;
}

// Search for a person (actor/director) on TMDB
async function searchPerson(name: string): Promise<PersonSearchResult | null> {
  const url = new URL('https://api.themoviedb.org/3/search/person');
  url.searchParams.append('api_key', PRIVATE_TMDB_API_KEY);
  url.searchParams.append('query', name);
  url.searchParams.append('language', 'en-US');

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Person search failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0];
    }
  } catch (error) {
    console.error(`Error searching for person "${name}":`, error);
  }

  return null;
}

// Get movies/shows for a specific person
async function getPersonCredits(personId: number, mediaType: 'movie' | 'tv'): Promise<MediaResult[]> {
  const url = new URL(`https://api.themoviedb.org/3/person/${personId}/${mediaType}_credits`);
  url.searchParams.append('api_key', PRIVATE_TMDB_API_KEY);
  url.searchParams.append('language', 'en-US');

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Credits search failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.cast || [];
  } catch (error) {
    console.error(`Error getting credits for person ${personId}:`, error);
    return [];
  }
}

// Process search results into a standardized format
function processResults(results: MediaResult[], mediaType: 'movie' | 'tv'): any[] {
  return results
    .map(item => ({
      id: item.id,
      title: item.title || item.name,
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
      original_language: item.original_language?.toUpperCase()
    }))
    .filter(item => item.poster_path && item.backdrop_path); // Only return items with images
}

// Main search function
export async function searchMedia({ query, mediaType, genres = [], platforms = [] }: SearchParams) {
  console.log('Search params:', { query, mediaType, genres, platforms });

  // Parse the natural language query
  const parsedQuery = parseNaturalLanguageQuery(query);
  console.log('Parsed query:', parsedQuery);

  // If we found actor names, prioritize actor search
  if (parsedQuery.actorNames.length > 0) {
    console.log('Detected actor names:', parsedQuery.actorNames);
    
    // Search for each actor and get their IDs
    const actorSearches = await Promise.all(parsedQuery.actorNames.map(name => searchPerson(name)));
    const actorIds = actorSearches
      .filter((result): result is PersonSearchResult => result !== null)
      .map(result => result.id);

    if (actorIds.length > 0) {
      console.log('Found actor IDs:', actorIds);
      
      // Get credits for each actor
      const allCredits = await Promise.all(actorIds.map(id => getPersonCredits(id, mediaType)));
      
      // Merge and sort results by popularity
      let combinedResults = allCredits
        .flat()
        .sort((a, b) => b.popularity - a.popularity);

      // Filter by genres if specified
      if (genres.length > 0) {
        combinedResults = combinedResults.filter(item => 
          item.genre_ids.some(id => genres.includes(id.toString()))
        );
      }

      // Take top 5 results
      const topResults = combinedResults.slice(0, 5);
      return processResults(topResults, mediaType);
    }
  }

  // If no actor search or no results, use keywords for regular search
  const searchQuery = parsedQuery.keywords.length > 0 
    ? parsedQuery.keywords.join(' ')
    : query;

  const url = new URL(`https://api.themoviedb.org/3/search/${mediaType}`);
  url.searchParams.append('api_key', PRIVATE_TMDB_API_KEY);
  url.searchParams.append('query', searchQuery);
  url.searchParams.append('language', 'en-US');
  url.searchParams.append('page', '1');
  url.searchParams.append('include_adult', 'false');

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    const data = await response.json();
    let results = data.results || [];

    // Filter by genres if specified
    if (genres.length > 0) {
      results = results.filter((item: MediaResult) => 
        item.genre_ids.some(id => genres.includes(id.toString()))
      );
    }

    // Take top 5 results
    const topResults = results.slice(0, 5);
    return processResults(topResults, mediaType);
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
} 