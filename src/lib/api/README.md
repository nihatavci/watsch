# API Management System

A comprehensive, production-ready API management system for the Watsch application. This system provides unified access to multiple external APIs with robust error handling, caching, type safety, and development-friendly features.

## Features

- 🚀 **Centralized Management**: Single point of control for all API services
- 🔒 **Type Safety**: Full TypeScript support with comprehensive type definitions
- ⚡ **Performance**: Built-in caching, request deduplication, and retry logic
- 🛡️ **Error Handling**: Robust error handling with service-specific error messages
- 📊 **Monitoring**: Built-in metrics and health checking
- 🔧 **Development**: Mock data support for development without API keys
- 🎯 **Service Isolation**: Each API service is independently configurable
- 📈 **Scalable**: Designed to easily add new API services

## Architecture

```
src/lib/api/
├── core/
│   ├── api-client.ts      # Base HTTP client with retry logic
│   ├── config.ts          # Centralized configuration management
│   └── types.ts           # Comprehensive type definitions
├── services/
│   ├── tmdb-service.ts    # The Movie Database API service
│   ├── openai-service.ts  # OpenAI API service
│   └── ...                # Additional services
├── api-manager.ts         # Main orchestrator
├── index.ts              # Clean exports
└── README.md             # This file
```

## Quick Start

### 1. Initialize the API System

```typescript
import { initializeApi } from '$lib/api';

// Initialize with default settings
await initializeApi();

// Or with custom configuration
await initializeApi({
  enableCaching: true,
  cacheTimeout: 300000, // 5 minutes
  enableLogging: true,
  enableMetrics: true
});
```

### 2. Use the API Manager

```typescript
import { apiManager } from '$lib/api';

// Search for movies and TV shows
const searchResponse = await apiManager.search({
  query: 'Inception',
  type: 'multi',
  language: 'en-US',
  page: 1
});

// Get personalized recommendations
const recommendations = await apiManager.getRecommendations({
  mediaType: 'movie',
  genres: ['Action', 'Sci-Fi'],
  platforms: ['Netflix', 'Amazon Prime'],
  preferences: {
    minRating: 7.0,
    yearRange: { start: 2010, end: 2024 }
  }
});

// Get detailed media information
const details = await apiManager.getMediaDetails('123', 'movie', {
  includeWatchProviders: true,
  includeAIAnalysis: true
});
```

### 3. Use Individual Services

```typescript
import { tmdbService, openaiService } from '$lib/api';

// Direct TMDB usage
const movieDetails = await tmdbService.getMovieDetails(550);

// Direct OpenAI usage
const analysis = await openaiService.analyzeMovie({
  title: 'Fight Club',
  overview: 'An insomniac office worker...',
  genres: ['Drama', 'Thriller']
});
```

## Configuration

### Environment Variables

Create a `.env` file with your API keys:

```env
# Required for TMDB functionality
TMDB_API_KEY=your_tmdb_api_key_here

# Optional for AI features
OPENAI_API_KEY=your_openai_api_key_here

# Optional for additional services
YOUTUBE_API_KEY=your_youtube_api_key_here
RAPID_API_KEY=your_rapid_api_key_here
OMDB_API_KEY=your_omdb_api_key_here
```

### Development Mode

The system automatically provides mock data when:
- Running in development mode (`dev: true`)
- API keys are missing or are placeholder values

This allows you to develop and test without real API keys.

## API Services

### TMDB Service

Comprehensive integration with The Movie Database API:

```typescript
import { tmdbService } from '$lib/api';

// Search movies
const movies = await tmdbService.searchMovies('Inception');

// Search TV shows
const tvShows = await tmdbService.searchTVShows('Breaking Bad');

// Get detailed information
const movieDetails = await tmdbService.getMovieDetails(550);
const tvDetails = await tmdbService.getTVShowDetails(1396);

// Discover content with filters
const discoveries = await tmdbService.discoverMovies({
  withGenres: '28,12', // Action, Adventure
  voteAverageGte: 7.0,
  primaryReleaseYear: 2023
});

// Get streaming providers
const providers = await tmdbService.getWatchProviders(550, 'movie');

// Get genres
const movieGenres = await tmdbService.getMovieGenres();
const tvGenres = await tmdbService.getTVGenres();
```

### OpenAI Service

AI-powered content analysis and recommendations:

```typescript
import { openaiService } from '$lib/api';

// Analyze a movie
const analysis = await openaiService.analyzeMovie({
  title: 'The Matrix',
  overview: 'A computer hacker learns...',
  genres: ['Action', 'Sci-Fi'],
  voteAverage: 8.7
});

// Generate recommendation prompts
const prompt = await openaiService.generateRecommendationPrompt({
  mediaType: 'movie',
  genres: ['Horror', 'Thriller'],
  platforms: ['Netflix'],
  preferences: { minRating: 7.0 }
});

// Summarize content
const summary = await openaiService.summarizeContent(
  'Long content text...',
  { style: 'brief', maxLength: 200 }
);

// Generate creative content
const review = await openaiService.generateCreativeContent(
  'Write a review for The Godfather',
  'review',
  { tone: 'formal', length: 'medium' }
);
```

## Error Handling

The system provides comprehensive error handling:

```typescript
try {
  const response = await apiManager.search({ query: 'test', type: 'movie' });
  
  if (response.success) {
    // Handle successful response
    console.log(response.data.results);
  } else {
    // Handle API error
    console.error('Search failed:', response.error);
  }
} catch (error) {
  // Handle system error
  console.error('System error:', error);
}
```

## Caching

Built-in intelligent caching:

- **Automatic**: Responses are cached based on request parameters
- **TTL**: Configurable time-to-live (default: 5 minutes)
- **Smart Keys**: Cache keys include all relevant parameters
- **Memory Efficient**: Automatic cleanup of expired entries

```typescript
// Clear cache manually
apiManager.clearCache();

// Get cache statistics
const stats = apiManager.getCacheStats();
console.log(`Cache size: ${stats.size}, Keys: ${stats.keys.length}`);
```

## Monitoring & Metrics

Built-in metrics collection:

```typescript
const metrics = apiManager.getMetrics();
console.log({
  totalRequests: metrics.totalRequests,
  successRate: metrics.successfulRequests / metrics.totalRequests,
  avgResponseTime: metrics.averageResponseTime,
  serviceBreakdown: metrics.serviceMetrics
});

// Health check
const health = await apiManager.healthCheck();
console.log('Service health:', health);
```

## Type Safety

Comprehensive TypeScript support:

```typescript
import type { 
  MediaItem, 
  SearchRequest, 
  SearchResponse,
  TMDBMovie,
  OpenAIMessage 
} from '$lib/api';

// All API responses are fully typed
const response: SearchResponse = await apiManager.search({
  query: 'test',
  type: 'movie'
});

// Individual service types
const movie: TMDBMovie = response.data.results[0];
```

## Adding New Services

To add a new API service:

1. **Create the service class** in `src/lib/api/services/`:

```typescript
// src/lib/api/services/new-service.ts
export class NewService {
  private client: ApiClient;
  
  constructor() {
    this.client = new ApiClient({
      baseURL: 'https://api.example.com',
      // ... configuration
    });
  }
  
  async someMethod(): Promise<ServiceResponse<SomeType>> {
    // Implementation
  }
}

export const newService = new NewService();
```

2. **Add configuration** in `src/lib/api/core/config.ts`:

```typescript
const DEFAULT_CONFIG: ApiConfig = {
  // ... existing config
  newService: {
    baseURL: 'https://api.example.com',
    apiKey: '',
    timeout: 10000
  }
};
```

3. **Add types** in `src/lib/api/core/types.ts`:

```typescript
export interface NewServiceResponse {
  // Define response types
}
```

4. **Export from index** in `src/lib/api/index.ts`:

```typescript
export { NewService, newService } from './services/new-service.js';
```

## Best Practices

### 1. Always Handle Errors

```typescript
const response = await apiManager.search(request);
if (!response.success) {
  // Handle error appropriately
  return { error: response.error };
}
```

### 2. Use Type Guards

```typescript
function isMovieResult(item: MediaItem): item is MediaItem & { type: 'movie' } {
  return item.type === 'movie';
}
```

### 3. Leverage Caching

```typescript
// For frequently accessed data, caching is automatic
// For custom caching needs, consider the cache timeout
await initializeApi({
  cacheTimeout: 600000 // 10 minutes for longer-lived data
});
```

### 4. Monitor Performance

```typescript
// Regularly check metrics in production
const metrics = apiManager.getMetrics();
if (metrics.averageResponseTime > 2000) {
  console.warn('API response times are high');
}
```

## Development vs Production

### Development Features

- **Mock Data**: Automatic fallback when API keys are missing
- **Detailed Logging**: Enhanced logging for debugging
- **Flexible Configuration**: Easy to test different configurations

### Production Features

- **Performance Optimized**: Efficient caching and request handling
- **Error Recovery**: Robust retry logic and fallback mechanisms
- **Monitoring**: Comprehensive metrics and health checking
- **Security**: Secure API key handling and validation

## Troubleshooting

### Common Issues

1. **"API key not configured"**
   - Check your `.env` file
   - Ensure environment variables are loaded
   - Verify the key format

2. **"Service not responding"**
   - Check network connectivity
   - Verify API service status
   - Check rate limits

3. **"Cache issues"**
   - Clear cache: `apiManager.clearCache()`
   - Check cache statistics
   - Verify cache timeout settings

### Debug Mode

Enable detailed logging:

```typescript
await initializeApi({
  enableLogging: true,
  enableMetrics: true
});
```

## Contributing

When contributing to the API system:

1. **Follow TypeScript best practices**
2. **Add comprehensive error handling**
3. **Include mock data for development**
4. **Update type definitions**
5. **Add tests for new functionality**
6. **Update this documentation**

## License

This API management system is part of the Watsch project and follows the same license terms. 