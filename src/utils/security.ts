/**
 * Security utilities for input validation and sanitization
 */

// URL validation for social sharing
export const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

// Sanitize text input by removing potentially harmful characters
export const sanitizeText = (text: string): string => {
  return text
    .replace(/[<>]/g, '') // Remove angle brackets to prevent XSS
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .trim();
};

// Validate and sanitize URL for sharing
export const sanitizeUrl = (url: string): string => {
  if (!isValidUrl(url)) {
    return window.location.href; // Fallback to current page
  }
  
  try {
    const urlObj = new URL(url);
    // Keep the full URL including pathname, search, and hash for proper routing
    const cleanUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
    return cleanUrl;
  } catch {
    return window.location.href;
  }
};

// Validate social share data
export const validateShareData = (title: string, description: string, url?: string) => {
  return {
    title: sanitizeText(title).slice(0, 100), // Limit title length
    description: sanitizeText(description).slice(0, 200), // Limit description length
    url: url ? sanitizeUrl(url) : window.location.href
  };
};

// Rate limiting for actions (simple client-side implementation)
class RateLimiter {
  private actions: Map<string, number[]> = new Map();
  
  isAllowed(action: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.actions.has(action)) {
      this.actions.set(action, []);
    }
    
    const attempts = this.actions.get(action)!;
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => time > windowStart);
    
    if (recentAttempts.length >= maxAttempts) {
      return false;
    }
    
    recentAttempts.push(now);
    this.actions.set(action, recentAttempts);
    return true;
  }
}

export const rateLimiter = new RateLimiter();