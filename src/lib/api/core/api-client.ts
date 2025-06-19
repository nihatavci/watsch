/**
 * Core API Client - Centralized HTTP client with error handling, retries, and standardization
 */

export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  error?: string;
  status: number;
  timestamp: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryCondition?: (error: ApiError) => boolean;
}

export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  retries?: RetryConfig;
  defaultHeaders?: Record<string, string>;
  interceptors?: {
    request?: (config: RequestInit) => RequestInit | Promise<RequestInit>;
    response?: (response: Response) => Response | Promise<Response>;
    error?: (error: ApiError) => ApiError | Promise<ApiError>;
  };
}

export class ApiClient {
  private config: Required<ApiClientConfig>;

  constructor(config: ApiClientConfig = {}) {
    this.config = {
      baseURL: config.baseURL || '',
      timeout: config.timeout || 30000,
      retries: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        retryCondition: (error) => error.status >= 500 || error.status === 429,
        ...config.retries
      },
      defaultHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...config.defaultHeaders
      },
      interceptors: config.interceptors || {}
    };
  }

  /**
   * Make an HTTP request with full error handling and retry logic
   */
  async request<T = any>(
    endpoint: string,
    options: RequestInit & { 
      params?: Record<string, string>;
      timeout?: number;
      skipRetry?: boolean;
    } = {}
  ): Promise<ApiResponse<T>> {
    const { params, timeout, skipRetry, ...fetchOptions } = options;
    
    // Build URL
    const url = this.buildUrl(endpoint, params);
    
    // Prepare request config
    let requestConfig: RequestInit = {
      ...fetchOptions,
      headers: {
        ...this.config.defaultHeaders,
        ...fetchOptions.headers
      }
    };

    // Apply request interceptor
    if (this.config.interceptors.request) {
      requestConfig = await this.config.interceptors.request(requestConfig);
    }

    // Execute request with retry logic
    const maxAttempts = skipRetry ? 1 : this.config.retries.maxRetries + 1;
    let lastError: ApiError | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await this.executeRequest(url, requestConfig, timeout);
        
        // Apply response interceptor
        const processedResponse = this.config.interceptors.response 
          ? await this.config.interceptors.response(response)
          : response;

        return await this.processResponse<T>(processedResponse);
      } catch (error) {
        lastError = error as ApiError;
        
        // Apply error interceptor
        if (this.config.interceptors.error) {
          lastError = await this.config.interceptors.error(lastError);
        }

        // Check if we should retry
        if (attempt < maxAttempts && this.shouldRetry(lastError, attempt)) {
          const delay = this.calculateDelay(attempt);
          console.warn(`API request failed (attempt ${attempt}/${maxAttempts}), retrying in ${delay}ms:`, lastError.message);
          await this.sleep(delay);
          continue;
        }

        break;
      }
    }

    // All retries exhausted, throw the last error
    throw lastError;
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, params?: Record<string, string>, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET', params });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    const baseUrl = this.config.baseURL;
    const url = new URL(endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value);
        }
      });
    }
    
    return url.toString();
  }

  private async executeRequest(url: string, config: RequestInit, timeout?: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout || this.config.timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError('Request timeout', 408);
        }
        throw new ApiError(error.message, 0);
      }
      
      throw new ApiError('Unknown error occurred', 0);
    }
  }

  private async processResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const timestamp = new Date().toISOString();

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorDetails: any = null;

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        errorDetails = errorData;
      } catch {
        // If we can't parse the error response, use the status text
      }

      throw new ApiError(errorMessage, response.status, errorDetails);
    }

    let data: T;
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else if (contentType?.includes('text/')) {
      data = await response.text() as unknown as T;
    } else {
      data = await response.blob() as unknown as T;
    }

    return {
      data,
      success: true,
      status: response.status,
      timestamp
    };
  }

  private shouldRetry(error: ApiError, attempt: number): boolean {
    if (attempt >= this.config.retries.maxRetries) {
      return false;
    }

    return this.config.retries.retryCondition ? 
      this.config.retries.retryCondition(error) : 
      error.status >= 500 || error.status === 429;
  }

  private calculateDelay(attempt: number): number {
    const exponentialDelay = this.config.retries.baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay;
    return Math.min(exponentialDelay + jitter, this.config.retries.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Default API client instance
export const apiClient = new ApiClient(); 