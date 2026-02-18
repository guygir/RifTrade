/**
 * Riftle Puzzle Helper Functions
 * 
 * Core logic for managing daily puzzles and game state
 */

import { createSupabaseServerClient } from '@/lib/supabase/client';
import { RIFTLE_CONFIG, calculateGameScore } from './config';

/**
 * Get the current puzzle date
 * Returns the most recent puzzle whose date is on or before today
 * This ensures users can still play yesterday's puzzle if today's hasn't been generated yet
 */
export async function getCurrentPuzzleDate(supabase: ReturnType<typeof createSupabaseServerClient>): Promise<string | null> {
  const today = new Date().toISOString().split("T")[0];
  
  const { data, error } = await supabase
    .from("daily_cards")
    .select("puzzle_date")
    .lte("puzzle_date", today)
    .order("puzzle_date", { ascending: false })
    .limit(1)
    .single();
  
  if (error) {
    console.error('Error fetching current puzzle date:', error);
    return null;
  }
  
  return data?.puzzle_date ?? null;
}

/**
 * Get the daily puzzle for a specific date
 */
export async function getDailyPuzzle(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  puzzleDate: string
) {
  const { data, error } = await supabase
    .from("daily_cards")
    .select(`
      id,
      puzzle_date,
      card_id,
      cards (
        id,
        name,
        set_code,
        collector_number,
        rarity,
        metadata
      )
    `)
    .eq("puzzle_date", puzzleDate)
    .single();
  
  if (error) {
    console.error('Error fetching daily puzzle:', error);
    return null;
  }
  
  return data;
}

/**
 * Get user's guess state for a puzzle
 */
export async function getUserGuessState(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  userId: string,
  puzzleId: string
) {
  const { data, error } = await supabase
    .from("guesses")
    .select("*")
    .eq("user_id", userId)
    .eq("puzzle_id", puzzleId)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error fetching user guess state:', error);
    return null;
  }
  
  return data;
}

/**
 * Calculate streak based on last played date
 */
export function calculateStreak(
  lastPlayedDate: string | null,
  currentStreak: number,
  won: boolean
): { newStreak: number; maxStreak: number } {
  const today = new Date().toISOString().split("T")[0];
  
  if (!won) {
    return { newStreak: 0, maxStreak: currentStreak };
  }
  
  if (!lastPlayedDate) {
    // First game ever
    return { newStreak: 1, maxStreak: 1 };
  }
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  
  if (lastPlayedDate === yesterdayStr) {
    // Played yesterday, increment streak
    const newStreak = currentStreak + 1;
    return { newStreak, maxStreak: Math.max(newStreak, currentStreak) };
  } else if (lastPlayedDate === today) {
    // Already played today, keep current streak
    return { newStreak: currentStreak, maxStreak: currentStreak };
  } else {
    // Missed a day, reset streak
    return { newStreak: 1, maxStreak: currentStreak };
  }
}

/**
 * Calculate score for a completed puzzle
 * Lower guesses = higher score
 * Uses config value for max guesses
 */
export function calculateScore(guessesUsed: number): number {
  return calculateGameScore(guessesUsed);
}

/**
 * Select a random card for the daily puzzle
 * Excludes recently used cards (includes all card variants)
 */
export async function selectRandomCard(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  excludeDays: number = 30
): Promise<string | null> {
  // Get recently used card IDs
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - excludeDays);
  const cutoffDateStr = cutoffDate.toISOString().split("T")[0];
  
  const { data: recentCards } = await supabase
    .from("daily_cards")
    .select("card_id")
    .gte("puzzle_date", cutoffDateStr);
  
  const excludedIds = recentCards?.map(r => r.card_id) || [];
  
  // Get all cards (includes foil, alternate art, and all variants)
  const { data: cards, error } = await supabase
    .from("cards")
    .select("id, name, metadata");
  
  if (error || !cards || cards.length === 0) {
    console.error('Error fetching cards for puzzle:', error);
    return null;
  }
  
  // Filter out excluded cards
  const eligibleCards = cards.filter(card => !excludedIds.includes(card.id));
  
  if (eligibleCards.length === 0) {
    console.warn('No eligible cards found, using all cards');
    // Fallback to all cards if no eligible ones
    return cards[Math.floor(Math.random() * cards.length)].id;
  }
  
  // Select random card
  const randomCard = eligibleCards[Math.floor(Math.random() * eligibleCards.length)];
  return randomCard.id;
}

/**
 * Update user stats after completing a puzzle
 */
export async function updateUserStats(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  userId: string,
  guessesUsed: number,
  isSolved: boolean,
  maxGuesses: number = 6
) {
  const today = new Date().toISOString().split("T")[0];
  
  // Get current stats
  const { data: currentStats } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .single();
  
  const stats = currentStats || {
    total_games: 0,
    failed_games: 0,
    current_streak: 0,
    max_streak: 0,
    total_score: 0,
    average_guesses: 0,
    last_played_date: null,
    solved_distribution: {},
  };
  
  // Calculate new values
  const totalGames = stats.total_games + 1;
  const failedGames = isSolved ? stats.failed_games : stats.failed_games + 1;
  const score = isSolved ? calculateScore(guessesUsed) : 0;
  const totalScore = stats.total_score + score;
  
  // Update streak
  const { newStreak, maxStreak } = calculateStreak(
    stats.last_played_date,
    stats.current_streak,
    isSolved
  );
  
  // Update solved distribution
  const solvedDistribution = { ...stats.solved_distribution };
  if (isSolved) {
    const key = String(guessesUsed);
    solvedDistribution[key] = (solvedDistribution[key] || 0) + 1;
  }
  
  // Calculate average guesses (only for solved puzzles)
  const totalSolvedGames = totalGames - failedGames;
  let averageGuesses = stats.average_guesses;
  if (isSolved && totalSolvedGames > 0) {
    // Recalculate average from solved distribution
    let totalGuesses = 0;
    for (const [guesses, count] of Object.entries(solvedDistribution)) {
      totalGuesses += parseInt(guesses) * (count as number);
    }
    averageGuesses = totalGuesses / totalSolvedGames;
  }
  
  // Upsert stats
  const { error } = await supabase
    .from("user_stats")
    .upsert({
      user_id: userId,
      total_games: totalGames,
      failed_games: failedGames,
      current_streak: newStreak,
      max_streak: Math.max(maxStreak, newStreak),
      total_score: totalScore,
      average_guesses: averageGuesses,
      last_played_date: today,
      solved_distribution: solvedDistribution,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id'
    });
  
  if (error) {
    console.error('Error updating user stats:', error);
    throw error;
  }
  
  return {
    totalGames,
    failedGames,
    currentStreak: newStreak,
    maxStreak: Math.max(maxStreak, newStreak),
    totalScore,
    averageGuesses,
  };
}

// Made with Bob
