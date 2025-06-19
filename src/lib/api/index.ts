/**
 * API Module - Unified export for all API functionality
 * 
 * This module provides a comprehensive API management system with:
 * - Centralized configuration management
 * - Robust error handling and retry logic
 * - Caching and performance optimization
 * - Type-safe interfaces for all services
 * - Development-friendly mock data
 * - Metrics and monitoring
 */

// Core exports
export { ApiConfigManager } from './core/config.js';

// Service exports
export { TMDBService } from './services/tmdb-service.js';
export { OpenAIService } from './services/openai-service.js';

// Main API manager exports
import { ApiManager as ApiManagerClass } from './api-manager.js';
export { ApiManager } from './api-manager.js';

// Convenience re-exports for common operations
export const api = {
  // Get manager instance
  getInstance() {
    return ApiManagerClass.getInstance();
  },
  
  // Initialize the API system
  async initialize(envVars: Record<string, string | undefined>) {
    const manager = ApiManagerClass.getInstance();
    return manager.initialize(envVars);
  },
  
  // Health check
  getHealth() {
    const manager = ApiManagerClass.getInstance();
    return manager.getHealth();
  },
  
  // Metrics
  getMetrics() {
    const manager = ApiManagerClass.getInstance();
    return manager.getMetrics();
  }
};

// Default export for simple usage
export default api; 