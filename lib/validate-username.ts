/**
 * Username validation utilities for URL parameters
 * Prevents path traversal, XSS, and other attacks via username parameter
 */

/**
 * Validates a username from a URL parameter
 * Returns validation result with error message if invalid
 */
export function validateUsernameFromUrl(
  username: string | string[] | undefined | null
): { valid: boolean; error?: string; sanitized?: string } {
  // Handle array (shouldn't happen but be safe)
  if (Array.isArray(username)) {
    return { valid: false, error: 'Invalid username format' };
  }

  // Check if username exists
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' };
  }

  // Decode URL encoding
  let decoded: string;
  try {
    decoded = decodeURIComponent(username);
  } catch (e) {
    return { valid: false, error: 'Invalid username encoding' };
  }

  // Check for null bytes (security risk)
  if (decoded.includes('\0') || decoded.includes('%00')) {
    return { valid: false, error: 'Invalid username format' };
  }

  // Check length (3-30 characters)
  if (decoded.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  if (decoded.length > 30) {
    return { valid: false, error: 'Username must be at most 30 characters' };
  }

  // Check for path traversal patterns
  const pathTraversalPatterns = [
    '..',
    '/',
    '\\',
    '%2e%2e', // URL-encoded ..
    '%2f',    // URL-encoded /
    '%5c',    // URL-encoded \
  ];
  
  const lowerDecoded = decoded.toLowerCase();
  for (const pattern of pathTraversalPatterns) {
    if (lowerDecoded.includes(pattern)) {
      return { valid: false, error: 'Invalid username format' };
    }
  }

  // Validate format: alphanumeric, underscore, hyphen only
  if (!/^[a-zA-Z0-9_-]+$/.test(decoded)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }

  // All checks passed
  return { valid: true, sanitized: decoded.toLowerCase() };
}
