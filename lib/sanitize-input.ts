/**
 * Input sanitization utilities for saving user data
 * Sanitizes user inputs before storing in database
 * This provides defense in depth - sanitize on input AND output
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize display name before saving
 * - Strips all HTML tags
 * - Limits length to 100 characters
 * - Trims whitespace
 */
export function sanitizeDisplayName(input: string | null | undefined): string {
  if (!input) return '';
  
  // Strip all HTML tags
  let sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length to 100 characters
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100).trim();
  }
  
  return sanitized;
}

/**
 * Sanitize contact info before saving
 * - Strips dangerous HTML but may preserve URLs
 * - Limits length to 500 characters
 * - Trims whitespace
 */
export function sanitizeContactInfo(input: string | null | undefined): string {
  if (!input) return '';
  
  // Allow basic formatting but strip dangerous content
  let sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['a', 'br', 'p'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length to 500 characters
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 500).trim();
  }
  
  return sanitized;
}

/**
 * Sanitize trading locations before saving
 * - Strips all HTML tags
 * - Limits length to 200 characters
 * - Trims whitespace
 */
export function sanitizeTradingLocations(input: string | null | undefined): string {
  if (!input) return '';
  
  // Strip all HTML tags
  let sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length to 200 characters
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200).trim();
  }
  
  return sanitized;
}

/**
 * Sanitize username before saving
 * - Strips all HTML tags
 * - Limits length to 30 characters
 * - Trims whitespace
 * - Validates format (alphanumeric, underscore, hyphen only)
 */
export function sanitizeUsername(input: string | null | undefined): string {
  if (!input) return '';
  
  // Strip all HTML tags
  let sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
  
  // Trim whitespace and convert to lowercase
  sanitized = sanitized.trim().toLowerCase();
  
  // Remove any invalid characters (keep only alphanumeric, underscore, hyphen)
  sanitized = sanitized.replace(/[^a-z0-9_-]/g, '');
  
  // Limit length to 30 characters
  if (sanitized.length > 30) {
    sanitized = sanitized.substring(0, 30);
  }
  
  return sanitized;
}
