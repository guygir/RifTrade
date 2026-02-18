/**
 * Riftle Game Configuration
 * 
 * Centralized configuration for game settings
 */

export const RIFTLE_CONFIG = {
  /**
   * Maximum number of guesses allowed per puzzle
   * Change this value to adjust difficulty
   */
  MAX_GUESSES: 6,
  
  /**
   * Number of days to exclude recently used cards
   */
  EXCLUDE_RECENT_DAYS: 30,
  
  /**
   * Number of days ahead to generate puzzles (for cron buffer)
   */
  PUZZLE_BUFFER_DAYS: 3,
} as const;

/**
 * Calculate score based on guesses used
 * Lower guesses = higher score
 */
export function calculateGameScore(guessesUsed: number): number {
  return Math.max(0, RIFTLE_CONFIG.MAX_GUESSES - guessesUsed + 1);
}

// Made with Bob
