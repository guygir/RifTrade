/**
 * Sanitization utilities for XSS protection
 * Uses DOMPurify to sanitize user-generated content before display
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize plain text fields (display_name, trading_locations)
 * Removes all HTML tags and dangerous content
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';
  
  // Strip all HTML tags and return plain text
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true, // Keep text content but remove tags
  });
}

/**
 * Sanitize contact info (may contain URLs or special characters)
 * Allows basic formatting but removes dangerous content
 */
export function sanitizeContactInfo(text: string | null | undefined): string {
  if (!text) return '';
  
  // Allow basic text formatting but strip scripts and dangerous tags
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: ['a', 'br', 'p'], // Allow links and basic formatting
    ALLOWED_ATTR: ['href', 'target', 'rel'], // Allow link attributes
    ALLOW_DATA_ATTR: false,
    // Ensure URLs are safe
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}

/**
 * Sanitize a URL to ensure it's safe
 * Only allows http/https URLs
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return '#';
  
  // Only allow http/https URLs
  if (!url.match(/^https?:\/\//i)) {
    return '#';
  }
  
  // Sanitize the URL
  return DOMPurify.sanitize(url, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}
