/**
 * API Manager - Central orchestrator for all API services
 */

import { ApiConfigManager } from './core/config.js';
import { TMDBService } from './services/tmdb-service.js';
import { OpenAIService } from './services/openai-service.js';

export class ApiManager {
  private static instance: ApiManager | null = null;
  private tmdbService: TMDBService | null = null;
  private openaiService: OpenAIService | null = null;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private metrics = {
    requests: 0,
    cacheHits: 0,
    errors: 0,
    lastError: null as string | null
  };

  private constructor() {}

  static getInstance(): ApiManager {
    if (!ApiManager.instance) {
      ApiManager.instance = new ApiManager();
    }
    return ApiManager.instance;
  }

  async initialize(envVars: Record<string, string | undefined>): Promise<void> {
    try {
      // Initialize configuration
      const configManager = ApiConfigManager.getInstance();
      configManager.initialize(envVars);

      // Initialize services
      this.tmdbService = new TMDBService();
      this.openaiService = new OpenAIService();

      console.log('[ApiManager] Initialized successfully');
    } catch (error) {
      console.error('[ApiManager] Initialization failed:', error);
      throw error;
    }
  }

  // TMDB Service Methods
  async searchMovies(query: string, page = 1): Promise<any> {
    if (!this.tmdbService) {
      throw new Error('API Manager not initialized');
    }

    const cacheKey = `tmdb:search:movies:${query}:${page}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.metrics.cacheHits++;
      return cached;
    }

    try {
      this.metrics.requests++;
      const result = await this.tmdbService.searchMovies(query, page);
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      this.metrics.errors++;
      this.metrics.lastError = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  async searchTV(query: string, page = 1): Promise<any> {
    if (!this.tmdbService) {
      throw new Error('API Manager not initialized');
    }

    const cacheKey = `tmdb:search:tv:${query}:${page}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.metrics.cacheHits++;
      return cached;
    }

    try {
      this.metrics.requests++;
      const result = await this.tmdbService.searchTV(query, page);
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      this.metrics.errors++;
      this.metrics.lastError = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  async getMovieDetails(id: number): Promise<any> {
    if (!this.tmdbService) {
      throw new Error('API Manager not initialized');
    }

    const cacheKey = `tmdb:movie:${id}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.metrics.cacheHits++;
      return cached;
    }

    try {
      this.metrics.requests++;
      const result = await this.tmdbService.getMovieDetails(id);
      this.setCache(cacheKey, result, 10 * 60 * 1000); // 10 minutes for details
      return result;
    } catch (error) {
      this.metrics.errors++;
      this.metrics.lastError = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  async getTVDetails(id: number): Promise<any> {
    if (!this.tmdbService) {
      throw new Error('API Manager not initialized');
    }

    const cacheKey = `tmdb:tv:${id}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.metrics.cacheHits++;
      return cached;
    }

    try {
      this.metrics.requests++;
      const result = await this.tmdbService.getTVDetails(id);
      this.setCache(cacheKey, result, 10 * 60 * 1000); // 10 minutes for details
      return result;
    } catch (error) {
      this.metrics.errors++;
      this.metrics.lastError = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  async discoverMovies(params: Record<string, any> = {}): Promise<any> {
    if (!this.tmdbService) {
      throw new Error('API Manager not initialized');
    }

    const cacheKey = `tmdb:discover:movies:${JSON.stringify(params)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.metrics.cacheHits++;
      return cached;
    }

    try {
      this.metrics.requests++;
      const result = await this.tmdbService.discoverMovies(params);
      
      // Ensure description field is mapped from overview
      if (result?.results) {
        result.results = result.results.map((item: any) => ({
          ...item,
          description: item.overview || ''
        }));
      }
      
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      this.metrics.errors++;
      this.metrics.lastError = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  async discoverTV(params: Record<string, any> = {}): Promise<any> {
    if (!this.tmdbService) {
      throw new Error('API Manager not initialized');
    }

    const cacheKey = `tmdb:discover:tv:${JSON.stringify(params)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.metrics.cacheHits++;
      return cached;
    }

    try {
      this.metrics.requests++;
      const result = await this.tmdbService.discoverTV(params);
      
      // Ensure description field is mapped from overview
      if (result?.results) {
        result.results = result.results.map((item: any) => ({
          ...item,
          description: item.overview || ''
        }));
      }
      
      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      this.metrics.errors++;
      this.metrics.lastError = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  async getWatchProviders(id: number, type: 'movie' | 'tv'): Promise<any> {
    if (!this.tmdbService) {
      throw new Error('API Manager not initialized');
    }

    const cacheKey = `tmdb:watch:${type}:${id}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.metrics.cacheHits++;
      return cached;
    }

    try {
      this.metrics.requests++;
      const result = await this.tmdbService.getWatchProviders(id, type);
      this.setCache(cacheKey, result, 24 * 60 * 60 * 1000); // 24 hours for watch providers
      return result;
    } catch (error) {
      this.metrics.errors++;
      this.metrics.lastError = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  // OpenAI Service Methods
  async analyzeContent(content: string, context?: string): Promise<any> {
    if (!this.openaiService) {
      throw new Error('API Manager not initialized');
    }

    const cacheKey = `openai:analyze:${content.substring(0, 50)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.metrics.cacheHits++;
      return cached;
    }

    try {
      this.metrics.requests++;
      const result = await this.openaiService.analyzeContent(content, context);
      this.setCache(cacheKey, result, 60 * 60 * 1000); // 1 hour for analysis
      return result;
    } catch (error) {
      this.metrics.errors++;
      this.metrics.lastError = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  /**
   * Get AI-enhanced recommendations based on user query and filters
   */
  async getRecommendations(params: {
    query: string;
    mediaType: 'movie' | 'tv';
    genres?: number[];
    platforms?: string[];
    minRating?: number;
  }): Promise<any> {
    try {
      // Use TMDB discover API directly instead of the complex recommendation engine
      const mediaType = params.mediaType === 'tv' ? 'tv' : 'movie';
      const genreIds = params.genres?.join(',') || '';
      
      const discoverParams: Record<string, any> = {
        sort_by: 'popularity.desc',
        page: 1
      };
      
      // Add genre filter if provided
      if (genreIds) {
        discoverParams.with_genres = genreIds;
      }
      
      // Add minimum rating filter if specified
      if (params.minRating && params.minRating > 0) {
        discoverParams['vote_average.gte'] = params.minRating;
      }
      
      // Use discover API for reliable results
      let result;
      if (mediaType === 'tv') {
        result = await this.discoverTV(discoverParams);
      } else {
        result = await this.discoverMovies(discoverParams);
      }
      
      // Limit to 5 results and ensure description field is present
      const results = (result?.data?.data?.results || result?.data?.results || result?.results || [])
        .slice(0, 5)
        .map((item: any) => ({
          ...item,
          description: item.overview || item.description || ''
        }));
      
      return {
        success: true,
        data: {
          data: {
            results: results
          }
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('ApiManager.getRecommendations error:', error);
      throw error;
    }
  }

  /**
   * Generate OpenAI recommendations (legacy method)
   */
  async generateRecommendations(preferences: string, count = 5): Promise<any> {
    if (!this.openaiService) {
      throw new Error('API Manager not initialized');
    }

    const cacheKey = `openai:recommend:${preferences.substring(0, 50)}:${count}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.metrics.cacheHits++;
      return cached;
    }

    try {
      this.metrics.requests++;
      const result = await this.openaiService.generateRecommendations(preferences, count);
      this.setCache(cacheKey, result, 30 * 60 * 1000); // 30 minutes for recommendations
      return result;
    } catch (error) {
      this.metrics.errors++;
      this.metrics.lastError = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  // Cache Management
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any, ttl = 5 * 60 * 1000): void {
    // Clean up old entries if cache is getting large
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  clearCache(): void {
    this.cache.clear();
  }

  // Health and Metrics
  getHealth(): any {
    const configManager = ApiConfigManager.getInstance();
    return {
      status: 'healthy',
      initialized: configManager.isInitialized(),
      services: {
        tmdb: !!this.tmdbService,
        openai: !!this.openaiService
      },
      cache: {
        size: this.cache.size,
        hitRate: this.metrics.requests > 0 ? this.metrics.cacheHits / this.metrics.requests : 0
      },
      metrics: this.metrics
    };
  }

  getMetrics(): any {
    return {
      ...this.metrics,
      cacheSize: this.cache.size,
      hitRate: this.metrics.requests > 0 ? this.metrics.cacheHits / this.metrics.requests : 0
    };
  }
} 