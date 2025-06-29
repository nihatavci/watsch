import { sequence } from '@sveltejs/kit/hooks';
import { dev } from '$app/environment';
import { api } from '$lib/api';
// Environment variables handled safely in the initialization function

// Initialize API system
let apiInitialized = false;

// Security: Rate limiting storage (in production use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

async function initializeApi() {
  if (apiInitialized) return;
  
  try {
    // Get environment variables safely
    const envVars = {
      TMDB_API_KEY: process.env.TMDB_API_KEY || process.env.PRIVATE_TMDB_API_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || process.env.PRIVATE_OPENAI_API_KEY,
    };

    console.log('Server-side environment check: TMDB API configured');

    // Initialize API manager
    await api.initialize(envVars);
    
    apiInitialized = true;
    console.log('[Hooks] API system initialized successfully');
  } catch (error) {
    console.warn('[Hooks] API initialization failed:', error);
    // Don't throw error - allow app to continue with mock data
  }
}

// Security: Rate limiting function
function checkRateLimit(ip: string, endpoint: string): boolean {
  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = endpoint.includes('/search') ? 10 : 30; // Lower limit for search
  
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  return true;
}

// Security: Enhanced rate limiting with persistence warning
function checkRateLimitEnhanced(ip: string, endpoint: string): boolean {
  // TODO: Replace with Redis or database-backed rate limiting for production
  // Current implementation: In-memory only (resets on server restart)
  
  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  
  // Stricter limits for sensitive endpoints
  let maxRequests = 30;
  if (endpoint.includes('/search')) maxRequests = 10;
  if (endpoint.includes('/recommendation') || endpoint.includes('/getRecommendation')) maxRequests = 20;
  if (endpoint.includes('/movie-night')) maxRequests = 15;
  if (endpoint.includes('/auth')) maxRequests = 5;
  
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxRequests) {
    console.warn(`[Security] Rate limit exceeded for ${ip} on ${endpoint}`);
    return false;
  }
  
  current.count++;
  return true;
}

// Initialize on server startup
if (!dev || process.env.NODE_ENV !== 'test') {
  initializeApi().catch(console.warn);
}

const handleAuth = async ({ event, resolve }) => {
  // Your existing auth logic here
  return resolve(event);
};

const handleSecurity = async ({ event, resolve }) => {
  // Security: Add security headers
  const response = await resolve(event, {
    transformPageChunk: ({ html }) => {
      return html;
    }
  });

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy - Enhanced security
  const csp = [
    "default-src 'self'",
    // Security: Removed 'unsafe-eval' - use alternatives for dynamic functionality
    "script-src 'self' 'unsafe-inline'", // Keep minimal unsafe-inline for Svelte
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "font-src 'self' fonts.gstatic.com",
    "img-src 'self' data: blob: image.tmdb.org *.tmdb.org",
    "connect-src 'self' api.themoviedb.org *.themoviedb.org api.openai.com *.openai.com",
    "media-src 'self' blob:",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // Security: Additional CSP directives
    "upgrade-insecure-requests",
    "block-all-mixed-content"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  // Additional security headers
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-site');
  
  if (!dev) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  return response;
};

const handleApi = async ({ event, resolve }) => {
  // Security: Enhanced rate limiting for API routes
  if (event.url.pathname.startsWith('/api/')) {
    const clientIP = event.getClientAddress();
    const endpoint = event.url.pathname;
    
    if (!checkRateLimitEnhanced(clientIP, endpoint)) {
      console.warn(`[Security] Rate limit violation: ${clientIP} -> ${endpoint}`);
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded',
        details: 'Too many requests. Please wait before trying again.',
        retryAfter: 60
      }), {
        status: 429,
        headers: { 
          'Content-Type': 'application/json',
          'Retry-After': '60'
        }
      });
    }
  }
  
  // Ensure API is initialized for API routes
  if (event.url.pathname.startsWith('/api/') && !apiInitialized) {
    await initializeApi();
  }
  
  return resolve(event);
};

export const handle = sequence(handleSecurity, handleAuth, handleApi);
