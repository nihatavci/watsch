/**
 * TMDB Service - Comprehensive service for The Movie Database API
 */

import { ApiClient } from '../core/api-client.js';
import { getServiceConfig } from '../core/config.js';
import { dev } from '$app/environment';
import type {
  TMDBMovie,
  TMDBTVShow,
  TMDBMovieDetails,
  TMDBTVShowDetails,
  TMDBSearchResponse,
  TMDBWatchProviders,
  TMDBGenre,
  ServiceResponse,
  MediaItem,
  StreamingProvider,
  TMDBTVDetails,
  TMDBDiscoverResponse,
  TMDBWatchProvidersResponse
} from '../core/types.js';

export class TMDBService {
  private client: ApiClient;
  private config: any;

  constructor() {
    this.config = getServiceConfig('tmdb');
    // Force API key from environment if not set in config
    if (!this.config.apiKey || this.config.apiKey.length < 10) {
      // Try to get from environment directly
      const envKey = typeof process !== 'undefined' ? 
        (process.env.TMDB_API_KEY || process.env.PRIVATE_TMDB_API_KEY) : 
        undefined;
      if (envKey && envKey.length > 10) {
        this.config.apiKey = envKey;
        console.log('[TMDB Service] Using API key from direct environment access');
      } else {
        console.log('[TMDB Service] No valid API key found, will use mock data');
      }
    }
    this.client = new ApiClient({ baseURL: this.config.baseUrl });
  }

  private hasValidApiKey(): boolean {
    const isValid = !!(this.config?.apiKey && this.config.apiKey.length > 10);
    console.log('[TMDB Service] API key check:', {
      hasConfig: !!this.config,
      hasApiKey: !!this.config?.apiKey,
      keyLength: this.config?.apiKey?.length,
      isValid,
      keyPreview: this.config?.apiKey ? this.config.apiKey.substring(0, 5) + '...' : 'none'
    });
    return isValid;
  }

  private getDefaultParams() {
    if (!this.hasValidApiKey()) {
      return {};
    }
    return {
      api_key: this.config.apiKey,
      language: 'en-US'
    };
  }

  async searchMovies(query: string, page = 1): Promise<TMDBSearchResponse> {
    console.log('[TMDB Service] searchMovies called with query:', query);
    
    if (!this.hasValidApiKey()) {
      console.log('[TMDB Service] No valid API key, returning mock data');
      return this.getMockSearchResponse('movie');
    }

    try {
      console.log('[TMDB Service] Making real API call to TMDB');
      const params = {
        ...this.getDefaultParams(),
        query,
        page
      };
      console.log('[TMDB Service] API params:', params);
      
      const response = await this.client.get<TMDBSearchResponse>('/search/movie', params);
      console.log('[TMDB Service] Got real TMDB response:', response.results?.length, 'results');
      return response;
    } catch (error) {
      console.warn('TMDB search failed, returning mock data:', error);
      return this.getMockSearchResponse('movie');
    }
  }

  async searchTV(query: string, page = 1): Promise<TMDBSearchResponse> {
    if (!this.hasValidApiKey()) {
      return this.getMockSearchResponse('tv');
    }

    try {
      const response = await this.client.get<TMDBSearchResponse>('/search/tv', {
        ...this.getDefaultParams(),
        query,
        page
      });
      return response;
    } catch (error) {
      console.warn('TMDB TV search failed, returning mock data:', error);
      return this.getMockSearchResponse('tv');
    }
  }

  async getMovieDetails(id: number): Promise<TMDBMovieDetails> {
    if (!this.hasValidApiKey()) {
      return this.getMockMovieDetails(id);
    }

    try {
      const response = await this.client.get<TMDBMovieDetails>(`/movie/${id}`, {
        ...this.getDefaultParams(),
        append_to_response: 'credits,videos,watch/providers'
      });
      return response;
    } catch (error) {
      console.warn('TMDB movie details failed, returning mock data:', error);
      return this.getMockMovieDetails(id);
    }
  }

  async getTVDetails(id: number): Promise<TMDBTVDetails> {
    if (!this.hasValidApiKey()) {
      return this.getMockTVDetails(id);
    }

    try {
      const response = await this.client.get<TMDBTVDetails>(`/tv/${id}`, {
        ...this.getDefaultParams(),
        append_to_response: 'credits,videos,watch/providers'
      });
      return response;
    } catch (error) {
      console.warn('TMDB TV details failed, returning mock data:', error);
      return this.getMockTVDetails(id);
    }
  }

  async discoverMovies(params: Record<string, any> = {}): Promise<TMDBDiscoverResponse> {
    if (!this.hasValidApiKey()) {
      return this.getMockDiscoverResponse('movie');
    }

    try {
      const response = await this.client.get<TMDBDiscoverResponse>('/discover/movie', {
        ...this.getDefaultParams(),
        ...params
      });
      return response;
    } catch (error) {
      console.warn('TMDB discover movies failed, returning mock data:', error);
      return this.getMockDiscoverResponse('movie');
    }
  }

  async discoverTV(params: Record<string, any> = {}): Promise<TMDBDiscoverResponse> {
    if (!this.hasValidApiKey()) {
      return this.getMockDiscoverResponse('tv');
    }

    try {
      const response = await this.client.get<TMDBDiscoverResponse>('/discover/tv', {
        ...this.getDefaultParams(),
        ...params
      });
      return response;
    } catch (error) {
      console.warn('TMDB discover TV failed, returning mock data:', error);
      return this.getMockDiscoverResponse('tv');
    }
  }

  async getWatchProviders(id: number, type: 'movie' | 'tv'): Promise<TMDBWatchProvidersResponse> {
    if (!this.hasValidApiKey()) {
      return this.getMockWatchProviders();
    }

    try {
      const response = await this.client.get<TMDBWatchProvidersResponse>(`/${type}/${id}/watch/providers`, {
        ...this.getDefaultParams()
      });
      return response;
    } catch (error) {
      console.warn('TMDB watch providers failed, returning mock data:', error);
      return this.getMockWatchProviders();
    }
  }

  // Mock data methods for development/fallback
  private getMockSearchResponse(type: 'movie' | 'tv'): TMDBSearchResponse {
    const mockResults = type === 'movie' ? [
      {
        id: 1,
        title: 'Mock Movie 1',
        overview: 'This is a mock movie for development purposes.',
        poster_path: '/mock-poster-1.jpg',
        backdrop_path: '/mock-backdrop-1.jpg',
        release_date: '2023-01-01',
        vote_average: 8.5,
        vote_count: 1000,
        genre_ids: [28, 12],
        adult: false,
        original_language: 'en',
        original_title: 'Mock Movie 1',
        popularity: 100.0,
        video: false
      },
      {
        id: 2,
        title: 'Mock Movie 2',
        overview: 'Another mock movie for development.',
        poster_path: '/mock-poster-2.jpg',
        backdrop_path: '/mock-backdrop-2.jpg',
        release_date: '2023-02-01',
        vote_average: 7.8,
        vote_count: 800,
        genre_ids: [35, 18],
        adult: false,
        original_language: 'en',
        original_title: 'Mock Movie 2',
        popularity: 85.0,
        video: false
      }
    ] : [
      {
        id: 1,
        name: 'Mock TV Show 1',
        overview: 'This is a mock TV show for development purposes.',
        poster_path: '/mock-tv-poster-1.jpg',
        backdrop_path: '/mock-tv-backdrop-1.jpg',
        first_air_date: '2023-01-01',
        vote_average: 8.2,
        vote_count: 500,
        genre_ids: [18, 9648],
        adult: false,
        original_language: 'en',
        original_name: 'Mock TV Show 1',
        popularity: 90.0,
        origin_country: ['US']
      }
    ];

    return {
      page: 1,
      results: mockResults,
      total_pages: 1,
      total_results: mockResults.length
    };
  }

  private getMockMovieDetails(id: number): TMDBMovieDetails {
    return {
      id,
      title: `Mock Movie ${id}`,
      overview: 'This is a detailed mock movie for development purposes.',
      poster_path: `/mock-poster-${id}.jpg`,
      backdrop_path: `/mock-backdrop-${id}.jpg`,
      release_date: '2023-01-01',
      vote_average: 8.0,
      vote_count: 1000,
      runtime: 120,
      genres: [
        { id: 28, name: 'Action' },
        { id: 12, name: 'Adventure' }
      ],
      production_companies: [
        { id: 1, name: 'Mock Studios', logo_path: '/mock-logo.jpg', origin_country: 'US' }
      ],
      budget: 100000000,
      revenue: 500000000,
      tagline: 'A mock movie tagline',
      adult: false,
      belongs_to_collection: null,
      homepage: '',
      imdb_id: 'tt1234567',
      original_language: 'en',
      original_title: `Mock Movie ${id}`,
      popularity: 100.0,
      production_countries: [{ iso_3166_1: 'US', name: 'United States' }],
      spoken_languages: [{ english_name: 'English', iso_639_1: 'en', name: 'English' }],
      status: 'Released',
      video: false
    };
  }

  private getMockTVDetails(id: number): TMDBTVDetails {
    return {
      id,
      name: `Mock TV Show ${id}`,
      overview: 'This is a detailed mock TV show for development purposes.',
      poster_path: `/mock-tv-poster-${id}.jpg`,
      backdrop_path: `/mock-tv-backdrop-${id}.jpg`,
      first_air_date: '2023-01-01',
      last_air_date: '2023-12-31',
      vote_average: 8.5,
      vote_count: 800,
      genres: [
        { id: 18, name: 'Drama' },
        { id: 9648, name: 'Mystery' }
      ],
      number_of_episodes: 10,
      number_of_seasons: 1,
      seasons: [
        {
          id: 1,
          name: 'Season 1',
          overview: 'First season overview',
          poster_path: '/mock-season-poster.jpg',
          season_number: 1,
          episode_count: 10,
          air_date: '2023-01-01'
        }
      ],
      created_by: [
        { id: 1, name: 'Mock Creator', gender: 1, profile_path: '/mock-creator.jpg' }
      ],
      episode_run_time: [45],
      in_production: false,
      languages: ['en'],
      networks: [
        { id: 1, name: 'Mock Network', logo_path: '/mock-network.jpg', origin_country: 'US' }
      ],
      origin_country: ['US'],
      original_language: 'en',
      original_name: `Mock TV Show ${id}`,
      popularity: 90.0,
      production_companies: [
        { id: 1, name: 'Mock TV Studios', logo_path: '/mock-tv-logo.jpg', origin_country: 'US' }
      ],
      production_countries: [{ iso_3166_1: 'US', name: 'United States' }],
      spoken_languages: [{ english_name: 'English', iso_639_1: 'en', name: 'English' }],
      status: 'Ended',
      tagline: 'A mock TV show tagline',
      type: 'Scripted',
      adult: false,
      homepage: ''
    };
  }

  private getMockDiscoverResponse(type: 'movie' | 'tv'): TMDBDiscoverResponse {
    return this.getMockSearchResponse(type);
  }

  private getMockWatchProviders(): TMDBWatchProvidersResponse {
    return {
      id: 1,
      results: {
        US: {
          link: 'https://www.themoviedb.org/movie/1/watch?locale=US',
          flatrate: [
            {
              logo_path: '/mock-netflix.jpg',
              provider_id: 8,
              provider_name: 'Netflix',
              display_priority: 1
            }
          ],
          rent: [
            {
              logo_path: '/mock-amazon.jpg',
              provider_id: 10,
              provider_name: 'Amazon Video',
              display_priority: 2
            }
          ],
          buy: [
            {
              logo_path: '/mock-itunes.jpg',
              provider_id: 2,
              provider_name: 'Apple iTunes',
              display_priority: 3
            }
          ]
        }
      }
    };
  }
}

// Export singleton instance
export const tmdbService = new TMDBService(); 