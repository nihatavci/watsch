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
      configured: !!this.config?.apiKey,
      source: this.config?.apiKey ? 'environment' : 'none',
      status: this.config?.apiKey ? 'available' : 'missing'
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
        id: 278,
        title: 'The Shawshank Redemption',
        overview: 'Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank State Penitentiary.',
        poster_path: '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
        backdrop_path: '/iNh3BivHyg5sQRPP1KOkzguEX0H.jpg',
        release_date: '1994-09-23',
        vote_average: 8.7,
        vote_count: 26000,
        genre_ids: [18],
        adult: false,
        original_language: 'en',
        original_title: 'The Shawshank Redemption',
        popularity: 100.0,
        video: false
      },
      {
        id: 238,
        title: 'The Godfather',
        overview: 'Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family.',
        poster_path: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
        backdrop_path: '/tmU7GeKVybMWFButWEGl2M4GeiP.jpg',
        release_date: '1972-03-14',
        vote_average: 8.7,
        vote_count: 19000,
        genre_ids: [18, 80],
        adult: false,
        original_language: 'en',
        original_title: 'The Godfather',
        popularity: 92.0,
        video: false
      },
      {
        id: 424,
        title: 'Schindler\'s List',
        overview: 'The true story of how businessman Oskar Schindler saved over a thousand Jewish lives during the Holocaust.',
        poster_path: '/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg',
        backdrop_path: '/zb6fM1CX41D9rF9hdgclu0peUmy.jpg',
        release_date: '1993-12-15',
        vote_average: 8.6,
        vote_count: 15000,
        genre_ids: [18, 36, 10752],
        adult: false,
        original_language: 'en',
        original_title: 'Schindler\'s List',
        popularity: 88.0,
        video: false
      },
      {
        id: 155,
        title: 'The Dark Knight',
        overview: 'Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and District Attorney Harvey Dent.',
        poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
        backdrop_path: '/1hRoyzDtpgMU7Dz4JF22RANzQO7.jpg',
        release_date: '2008-07-18',
        vote_average: 8.5,
        vote_count: 32000,
        genre_ids: [18, 28, 80, 53],
        adult: false,
        original_language: 'en',
        original_title: 'The Dark Knight',
        popularity: 95.0,
        video: false
      },
      {
        id: 389,
        title: '12 Angry Men',
        overview: 'The defense and the prosecution have rested and the jury is filing into the jury room to decide if a young Spanish-American is guilty or innocent of murdering his father.',
        poster_path: '/ow3wq89wM8qd5X7hWKxiRfsFf9C.jpg',
        backdrop_path: '/qqHQsStV6exghCM7zbObuYBiYxw.jpg',
        release_date: '1957-04-10',
        vote_average: 8.5,
        vote_count: 8000,
        genre_ids: [18],
        adult: false,
        original_language: 'en',
        original_title: '12 Angry Men',
        popularity: 75.0,
        video: false
      }
    ] : [
      {
        id: 1399,
        name: 'Game of Thrones',
        overview: 'Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war.',
        poster_path: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
        backdrop_path: '/suopoADq0k8YZr4dQXcU6pToj6s.jpg',
        first_air_date: '2011-04-17',
        vote_average: 8.3,
        vote_count: 11000,
        genre_ids: [18, 10765, 10759],
        adult: false,
        original_language: 'en',
        original_name: 'Game of Thrones',
        popularity: 220.0,
        origin_country: ['US']
      },
      {
        id: 1396,
        name: 'Breaking Bad',
        overview: 'A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family\'s future.',
        poster_path: '/3xnWaLQjelJDDF7LT1WBo6f4BRe.jpg',
        backdrop_path: '/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
        first_air_date: '2008-01-20',
        vote_average: 8.9,
        vote_count: 12000,
        genre_ids: [18, 80],
        adult: false,
        original_language: 'en',
        original_name: 'Breaking Bad',
        popularity: 180.0,
        origin_country: ['US']
      },
      {
        id: 94605,
        name: 'Arcane',
        overview: 'Set in utopian Piltover and the oppressed underground of Zaun, the story follows the origins of two iconic League champions-and the power that will tear them apart.',
        poster_path: '/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg',
        backdrop_path: '/rkB4LyZHo1NHXFEDHl9vSD9r1lI.jpg',
        first_air_date: '2021-11-06',
        vote_average: 8.7,
        vote_count: 5000,
        genre_ids: [16, 18, 10765],
        adult: false,
        original_language: 'en',
        original_name: 'Arcane',
        popularity: 150.0,
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
    // Map of real movie data for common mock IDs
    const movieData: Record<number, any> = {
      278: {
        title: 'The Shawshank Redemption',
        overview: 'Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank State Penitentiary.',
        poster_path: '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
        backdrop_path: '/iNh3BivHyg5sQRPP1KOkzguEX0H.jpg',
        release_date: '1994-09-23',
        runtime: 142,
        imdb_id: 'tt0111161',
        genres: [{ id: 18, name: 'Drama' }]
      },
      238: {
        title: 'The Godfather',
        overview: 'Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family.',
        poster_path: '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
        backdrop_path: '/tmU7GeKVybMWFButWEGl2M4GeiP.jpg',
        release_date: '1972-03-14',
        runtime: 175,
        imdb_id: 'tt0068646',
        genres: [{ id: 18, name: 'Drama' }, { id: 80, name: 'Crime' }]
      }
    };

    const data = movieData[id] || {
      title: `Movie ${id}`,
      overview: 'A great movie for your entertainment.',
      poster_path: '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
      backdrop_path: '/iNh3BivHyg5sQRPP1KOkzguEX0H.jpg',
      release_date: '2023-01-01',
      runtime: 120,
      imdb_id: 'tt1234567',
      genres: [{ id: 28, name: 'Action' }, { id: 12, name: 'Adventure' }]
    };

    return {
      id,
      title: data.title,
      overview: data.overview,
      poster_path: data.poster_path,
      backdrop_path: data.backdrop_path,
      release_date: data.release_date,
      vote_average: 8.0,
      vote_count: 1000,
      runtime: data.runtime,
      genres: data.genres,
      production_companies: [
        { id: 1, name: 'Mock Studios', logo_path: '/mock-logo.jpg', origin_country: 'US' }
      ],
      budget: 100000000,
      revenue: 500000000,
      tagline: 'A great movie',
      adult: false,
      belongs_to_collection: null,
      homepage: '',
      imdb_id: data.imdb_id,
      original_language: 'en',
      original_title: data.title,
      popularity: 100.0,
      production_countries: [{ iso_3166_1: 'US', name: 'United States' }],
      spoken_languages: [{ english_name: 'English', iso_639_1: 'en', name: 'English' }],
      status: 'Released',
      video: false
    };
  }

  private getMockTVDetails(id: number): TMDBTVDetails {
    // Map of real TV show data for common mock IDs
    const tvData: Record<number, any> = {
      1399: {
        name: 'Game of Thrones',
        overview: 'Seven noble families fight for control of the mythical land of Westeros.',
        poster_path: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
        backdrop_path: '/suopoADq0k8YZr4dQXcU6pToj6s.jpg',
        first_air_date: '2011-04-17',
        last_air_date: '2019-05-19',
        genres: [{ id: 18, name: 'Drama' }, { id: 10765, name: 'Sci-Fi & Fantasy' }]
      },
      1396: {
        name: 'Breaking Bad',
        overview: 'A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine.',
        poster_path: '/3xnWaLQjelJDDF7LT1WBo6f4BRe.jpg',
        backdrop_path: '/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
        first_air_date: '2008-01-20',
        last_air_date: '2013-09-29',
        genres: [{ id: 18, name: 'Drama' }, { id: 80, name: 'Crime' }]
      }
    };

    const data = tvData[id] || {
      name: `TV Show ${id}`,
      overview: 'A great TV show for your entertainment.',
      poster_path: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
      backdrop_path: '/suopoADq0k8YZr4dQXcU6pToj6s.jpg',
      first_air_date: '2023-01-01',
      last_air_date: '2023-12-31',
      genres: [{ id: 18, name: 'Drama' }]
    };

    return {
      id,
      name: data.name,
      overview: data.overview,
      poster_path: data.poster_path,
      backdrop_path: data.backdrop_path,
      first_air_date: data.first_air_date,
      last_air_date: data.last_air_date,
      vote_average: 8.5,
      vote_count: 800,
      genres: data.genres,
      number_of_episodes: 10,
      number_of_seasons: 1,
      seasons: [
        {
          id: 1,
          name: 'Season 1',
          overview: 'First season overview',
          poster_path: data.poster_path,
          season_number: 1,
          episode_count: 10,
          air_date: data.first_air_date
        }
      ],
      created_by: [
        { id: 1, name: 'Creator', gender: 1, profile_path: '/mock-creator.jpg' }
      ],
      episode_run_time: [45],
      in_production: false,
      languages: ['en'],
      networks: [
        { id: 1, name: 'Network', logo_path: '/mock-network.jpg', origin_country: 'US' }
      ],
      origin_country: ['US'],
      original_language: 'en',
      original_name: data.name,
      popularity: 90.0,
      production_companies: [
        { id: 1, name: 'TV Studios', logo_path: '/mock-tv-logo.jpg', origin_country: 'US' }
      ],
      production_countries: [{ iso_3166_1: 'US', name: 'United States' }],
      spoken_languages: [{ english_name: 'English', iso_639_1: 'en', name: 'English' }],
      status: 'Ended',
      tagline: 'A great TV show',
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