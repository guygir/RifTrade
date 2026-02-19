/**
 * Geographic utilities for country detection and trading restrictions
 */

export interface GeoLocation {
  country_code: string;
  country_name: string;
  city?: string;
  ip?: string;
}

/**
 * Detect user's country from IP address
 * Uses ipapi.co free tier (1000 requests/day)
 *
 * IMPORTANT: If API fails or limit exceeded, returns null.
 * Caller should treat null as "NOT from Israel" for security.
 */
export async function detectCountry(): Promise<{ code: string | null; name: string | null }> {
  try {
    const response = await fetch('https://ipapi.co/json/', {
      headers: {
        'User-Agent': 'RifTrade/1.0'
      }
    });
    
    if (!response.ok) {
      console.error('Failed to detect country:', response.status);
      // Fallback: assume NOT from Israel if API fails
      return { code: null, name: null };
    }
    
    const data: GeoLocation = await response.json();
    return {
      code: data.country_code || null,
      name: data.country_name || null
    };
  } catch (error) {
    console.error('Error detecting country:', error);
    // Fallback: assume NOT from Israel if API fails
    return { code: null, name: null };
  }
}

/**
 * Check if a country code allows trading
 * Currently only Israel (IL) allows trading
 *
 * IMPORTANT: Returns false if countryCode is null (API failure case)
 */
export function isTradingAllowed(countryCode: string | null): boolean {
  if (!countryCode) return false; // Assume NOT from Israel if detection failed
  return countryCode.toUpperCase() === 'IL';
}

/**
 * Get flag emoji for country code
 */
export function getCountryFlag(countryCode: string | null): string {
  if (!countryCode) return '🌍'; // Generic globe for unknown
  
  // Convert country code to flag emoji
  // Each letter becomes a regional indicator symbol
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * Get display text for country detection
 */
export function getCountryDisplayText(countryCode: string | null, countryName: string | null): string {
  if (!countryCode || !countryName) {
    return '🌍 Unknown Location';
  }
  
  const flag = getCountryFlag(countryCode);
  return `${flag} ${countryName}`;
}

/**
 * Get user-friendly message for non-trading regions
 */
export function getTradingRestrictionMessage(): string {
  return "Trading isn't possible in your region. But you can play Riftle!";
}

/**
 * Get detailed restriction info for signup warning
 */
export function getRestrictionDetails() {
  return {
    title: "🌍 Welcome to RifTrade!",
    message: "Trading isn't possible in your region. But you can play Riftle!",
    allowed: [
      "Play daily Riftle puzzle",
      "Compete on global leaderboard",
      "Track your stats and streaks"
    ],
    notAllowed: [
      "Card trading features"
    ]
  };
}

// Made with Bob
