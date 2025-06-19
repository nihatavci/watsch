/**
 * API Types - Comprehensive TypeScript definitions for all API services
 */

// Common API response structure
export interface BaseApiResponse {
  success: boolean;
  timestamp: string;
  status: number;
}

export interface PaginatedResponse<T> extends BaseApiResponse {
  data: T[];
  pagination: {
    page: number;
    totalPages: number;
    totalResults: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// TMDB API Types
export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  genre_ids: number[];
  original_language: string;
  video: boolean;
}

export interface TMDBTVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  original_language: string;
  origin_country: string[];
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBProductionCompany {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}

export interface TMDBProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface TMDBSpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface TMDBMovieDetails extends Omit<TMDBMovie, 'genre_ids'> {
  belongs_to_collection: {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
  } | null;
  budget: number;
  genres: TMDBGenre[];
  homepage: string;
  imdb_id: string;
  production_companies: TMDBProductionCompany[];
  production_countries: TMDBProductionCountry[];
  revenue: number;
  runtime: number;
  spoken_languages: TMDBSpokenLanguage[];
  status: string;
  tagline: string;
}

export interface TMDBTVShowDetails extends Omit<TMDBTVShow, 'genre_ids'> {
  created_by: {
    id: number;
    credit_id: string;
    name: string;
    gender: number;
    profile_path: string | null;
  }[];
  episode_run_time: number[];
  genres: TMDBGenre[];
  homepage: string;
  in_production: boolean;
  languages: string[];
  last_air_date: string;
  last_episode_to_air: {
    air_date: string;
    episode_number: number;
    id: number;
    name: string;
    overview: string;
    production_code: string;
    season_number: number;
    still_path: string | null;
    vote_average: number;
    vote_count: number;
  };
  networks: {
    id: number;
    name: string;
    logo_path: string | null;
    origin_country: string;
  }[];
  number_of_episodes: number;
  number_of_seasons: number;
  production_companies: TMDBProductionCompany[];
  production_countries: TMDBProductionCountry[];
  seasons: {
    air_date: string;
    episode_count: number;
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    season_number: number;
  }[];
  spoken_languages: TMDBSpokenLanguage[];
  status: string;
  tagline: string;
  type: string;
}

export interface TMDBSearchResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TMDBWatchProvider {
  display_priority: number;
  logo_path: string;
  provider_id: number;
  provider_name: string;
}

export interface TMDBWatchProviders {
  id: number;
  results: {
    [countryCode: string]: {
      link: string;
      flatrate?: TMDBWatchProvider[];
      rent?: TMDBWatchProvider[];
      buy?: TMDBWatchProvider[];
    };
  };
}

// OpenAI API Types
export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIChatCompletionRequest {
  model: string;
  messages: OpenAIMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[];
  presence_penalty?: number;
  frequency_penalty?: number;
}

export interface OpenAIChatCompletionChoice {
  index: number;
  message: OpenAIMessage;
  finish_reason: 'stop' | 'length' | 'content_filter' | null;
}

export interface OpenAIChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIChatCompletionChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// YouTube API Types
export interface YouTubeVideo {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      [key: string]: {
        url: string;
        width: number;
        height: number;
      };
    };
    channelTitle: string;
    tags?: string[];
    categoryId: string;
    liveBroadcastContent: string;
    defaultLanguage?: string;
    defaultAudioLanguage?: string;
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
    dislikeCount: string;
    favoriteCount: string;
    commentCount: string;
  };
}

export interface YouTubeSearchResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  regionCode: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeVideo[];
}

// OMDB API Types
export interface OMDBMovie {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: {
    Source: string;
    Value: string;
  }[];
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
  DVD?: string;
  BoxOffice?: string;
  Production?: string;
  Website?: string;
  Response: string;
}

export interface OMDBSearchResult {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

export interface OMDBSearchResponse {
  Search: OMDBSearchResult[];
  totalResults: string;
  Response: string;
  Error?: string;
}

// Application-specific types
export interface MediaItem {
  id: string;
  title: string;
  type: 'movie' | 'tv';
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  voteAverage: number;
  genres: string[];
  streamingProviders?: StreamingProvider[];
}

export interface StreamingProvider {
  id: number;
  name: string;
  logoPath: string;
  type: 'flatrate' | 'rent' | 'buy';
  displayPriority: number;
}

export interface RecommendationRequest {
  mediaType: 'movie' | 'tv';
  genres: string[];
  platforms: string[];
  preferences?: {
    minRating?: number;
    maxRating?: number;
    yearRange?: {
      start: number;
      end: number;
    };
    language?: string;
    includeAdult?: boolean;
  };
}

export interface RecommendationResponse extends BaseApiResponse {
  data: {
    recommendations: MediaItem[];
    searchCriteria: RecommendationRequest;
    totalResults: number;
    aiAnalysis?: string;
  };
}

export interface SearchRequest {
  query: string;
  type: 'movie' | 'tv' | 'multi';
  language?: string;
  page?: number;
  includeAdult?: boolean;
}

export interface SearchResponse extends BaseApiResponse {
  data: {
    results: MediaItem[];
    query: string;
    totalResults: number;
    page: number;
    totalPages: number;
  };
}

// Database types
export interface WatchLaterItem {
  id: string;
  userId: string;
  mediaId: string;
  mediaType: 'movie' | 'tv';
  addedAt: string;
  mediaData: MediaItem;
}

export interface UserSearchLimit {
  ip: string;
  count: number;
  lastReset: string;
  isAuthenticated: boolean;
}

// Error types
export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    status: number;
    details?: any;
  };
  timestamp: string;
}

// Service-specific request/response types
export interface TMDBServiceRequest {
  endpoint: string;
  params?: Record<string, string>;
  language?: string;
}

export interface OpenAIServiceRequest {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface YouTubeServiceRequest {
  query: string;
  maxResults?: number;
  order?: 'date' | 'rating' | 'relevance' | 'title' | 'videoCount' | 'viewCount';
  type?: 'video' | 'channel' | 'playlist';
}

// Utility types
export type MediaType = 'movie' | 'tv';
export type ApiService = 'tmdb' | 'openai' | 'youtube' | 'rapidApi' | 'omdb';
export type SortOrder = 'asc' | 'desc';

// Generic service response wrapper
export interface ServiceResponse<T> extends BaseApiResponse {
  data: T;
  service: ApiService;
  cached?: boolean;
  requestId?: string;
} 