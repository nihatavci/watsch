import { dev } from '$app/environment';

export interface ApiConfig {
  tmdb: {
    apiKey: string;
    baseUrl: string;
    imageBaseUrl: string;
  };
  openai: {
    apiKey: string;
    baseUrl: string;
  };
  cache: {
    defaultTtl: number;
    maxSize: number;
  };
  retry: {
    maxAttempts: number;
    baseDelay: number;
  };
}

export class ApiConfigManager {
  private static instance: ApiConfigManager | null = null;
  private config: ApiConfig | null = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): ApiConfigManager {
    if (!ApiConfigManager.instance) {
      ApiConfigManager.instance = new ApiConfigManager();
    }
    return ApiConfigManager.instance;
  }

  initialize(envVars: Record<string, string | undefined>): void {
    this.config = {
      tmdb: {
        apiKey: envVars.TMDB_API_KEY || '',
        baseUrl: 'https://api.themoviedb.org/3',
        imageBaseUrl: 'https://image.tmdb.org/t/p',
      },
      openai: {
        apiKey: envVars.OPENAI_API_KEY || '',
        baseUrl: 'https://api.openai.com/v1',
      },
      cache: {
        defaultTtl: 5 * 60 * 1000, // 5 minutes
        maxSize: 100,
      },
      retry: {
        maxAttempts: 3,
        baseDelay: 1000,
      },
    };

    this.initialized = true;
    console.log('[ApiConfigManager] Initialized successfully');
  }

  getConfig(): ApiConfig {
    if (!this.initialized || !this.config) {
      return this.getDefaultConfig();
    }
    return this.config;
  }

  getServiceConfig(service: 'tmdb' | 'openai'): any {
    const config = this.getConfig();
    return config[service];
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  private getDefaultConfig(): ApiConfig {
    return {
      tmdb: {
        apiKey: '',
        baseUrl: 'https://api.themoviedb.org/3',
        imageBaseUrl: 'https://image.tmdb.org/t/p',
      },
      openai: {
        apiKey: '',
        baseUrl: 'https://api.openai.com/v1',
      },
      cache: {
        defaultTtl: 5 * 60 * 1000,
        maxSize: 100,
      },
      retry: {
        maxAttempts: 3,
        baseDelay: 1000,
      },
    };
  }
}

// Helper function to get service config safely
export function getServiceConfig(service: 'tmdb' | 'openai'): any {
  const manager = ApiConfigManager.getInstance();
  return manager.getServiceConfig(service);
}

// Global configuration manager instance
export const apiConfig = ApiConfigManager.getInstance(); 