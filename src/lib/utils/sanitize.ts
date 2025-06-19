import DOMPurify from 'dompurify';

/**
 * Security utility functions for input sanitization
 */

/**
 * Sanitize user input to prevent XSS attacks
 * @param input - The input string to sanitize
 * @returns Sanitized string safe for use
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: URLs
    .replace(/javascript:/gi, '')
    // Remove data: URLs
    .replace(/data:/gi, '')
    // Remove vbscript: URLs
    .replace(/vbscript:/gi, '')
    // Remove onload, onclick, and other event handlers
    .replace(/on\w+\s*=/gi, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Trim
    .trim();
}

/**
 * Sanitize HTML content specifically for display
 * @param html - HTML string to sanitize
 * @returns Safe HTML for display
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return html
    // Allow only safe HTML tags
    .replace(/<(?!\/?(?:p|br|b|i|strong|em|span|div)\b)[^>]*>/gi, '')
    // Remove all event handlers
    .replace(/on\w+\s*=[^>]*/gi, '')
    // Remove javascript: and data: URLs
    .replace(/(href|src)\s*=\s*["']?(javascript|data):[^"'\s>]*/gi, '')
    // Remove style attributes
    .replace(/style\s*=[^>]*/gi, '');
}

/**
 * Validate and sanitize search query
 * @param query - Search query to validate
 * @returns Sanitized query or throws error if invalid
 */
export function validateSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') {
    throw new Error('Invalid query parameter');
  }

  const sanitized = sanitizeInput(query);
  
  if (sanitized.length === 0) {
    throw new Error('Query cannot be empty after sanitization');
  }
  
  if (sanitized.length > 500) {
    throw new Error('Query too long');
  }

  return sanitized;
}

/**
 * Escape special characters for safe inclusion in JSON
 * @param str - String to escape
 * @returns Escaped string
 */
export function escapeJson(str: string): string {
  if (!str || typeof str !== 'string') {
    return '';
  }

  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty);
} 